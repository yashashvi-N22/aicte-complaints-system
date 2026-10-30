import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.models.institution import Institution, InstituteType
from app.models.complaint import Complaint, ComplaintStatus
from app.models.user import User
from app.schemas.institution import (
    InstitutionCreate,
    InstitutionUpdate,
    InstitutionResponse,
    InstitutionListResponse,
)
from app.schemas.complaint import ComplaintResponse
from app.services.auth import get_current_user, require_admin
from app.services.audit import log_audit_event

router = APIRouter(prefix="/institutions", tags=["Institution Directory"])

def _build_institution_response(inst: Institution, db: Session) -> InstitutionResponse:
    # Compute counts
    total = db.query(func.count(Complaint.id)).filter(Complaint.institution_id == inst.id).scalar() or 0
    resolved = db.query(func.count(Complaint.id)).filter(
        Complaint.institution_id == inst.id,
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
    ).scalar() or 0
    pending = total - resolved

    return InstitutionResponse(
        id=inst.id,
        aicte_id=inst.aicte_id,
        name=inst.name,
        code=inst.code,
        institute_type=inst.institute_type,
        state=inst.state,
        district=inst.district,
        address=inst.address,
        pin_code=inst.pin_code,
        contact_email=inst.contact_email,
        contact_phone=inst.contact_phone,
        website=inst.website,
        is_active=inst.is_active,
        created_at=inst.created_at,
        updated_at=inst.updated_at,
        total_complaints=total,
        pending_complaints=pending,
        resolved_complaints=resolved
    )

@router.get("", response_model=InstitutionListResponse)
def list_institutions(
    q: Optional[str] = Query(None, description="Search by name, AICTE ID, or code"),
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district"),
    institute_type: Optional[InstituteType] = Query(None, description="Filter by institute type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: str = Query("name", description="Field to sort by: name, aicte_id, created_at"),
    sort_order: str = Query("asc", description="asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Institution)
    
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Institution.name.ilike(search_pattern),
                Institution.aicte_id.ilike(search_pattern),
                Institution.code.ilike(search_pattern),
                Institution.district.ilike(search_pattern)
            )
        )
    if state:
        query = query.filter(Institution.state.ilike(state))
    if district:
        query = query.filter(Institution.district.ilike(district))
    if institute_type:
        query = query.filter(Institution.institute_type == institute_type)
    if is_active is not None:
        query = query.filter(Institution.is_active == is_active)
        
    total = query.count()
    
    # Sorting
    sort_column = getattr(Institution, sort_by, Institution.name)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
        
    offset = (page - 1) * page_size
    institutions = query.offset(offset).limit(page_size).all()
    
    items = [_build_institution_response(inst, db) for inst in institutions]
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return InstitutionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/meta/states", response_model=List[dict])
def get_states_and_districts(db: Session = Depends(get_db)):
    """Returns available states and their corresponding districts for filter dropdowns"""
    rows = db.query(Institution.state, Institution.district).distinct().all()
    state_map = {}
    for state, dist in rows:
        if state not in state_map:
            state_map[state] = set()
        if dist:
            state_map[state].add(dist)
            
    return [{"state": state, "districts": sorted(list(districts))} for state, districts in sorted(state_map.items())]

@router.get("/{institution_id}", response_model=dict)
def get_institution_profile(
    institution_id: int,
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    profile_data = _build_institution_response(inst, db).model_dump()
    
    # Fetch recent complaints of this institution
    complaints = db.query(Complaint).filter(
        Complaint.institution_id == inst.id
    ).order_by(Complaint.created_at.desc()).limit(20).all()
    
    complaint_items = []
    for c in complaints:
        complaint_items.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "title": c.title,
            "category": c.category,
            "priority": c.priority,
            "status": c.status,
            "created_at": c.created_at,
            "assigned_department_name": c.assigned_department.name if c.assigned_department else None
        })
        
    profile_data["complaints"] = complaint_items
    
    # Breakdown by status
    status_counts = db.query(Complaint.status, func.count(Complaint.id)).filter(
        Complaint.institution_id == inst.id
    ).group_by(Complaint.status).all()
    
    profile_data["status_breakdown"] = {s.value: count for s, count in status_counts}
    
    return profile_data

@router.post("", response_model=InstitutionResponse)
def create_institution(
    inst_in: InstitutionCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if db.query(Institution).filter(Institution.aicte_id == inst_in.aicte_id).first():
        raise HTTPException(status_code=400, detail="Institution with this AICTE ID already exists")
    if inst_in.code and db.query(Institution).filter(Institution.code == inst_in.code).first():
        raise HTTPException(status_code=400, detail="Institution with this Code already exists")
        
    inst = Institution(
        aicte_id=inst_in.aicte_id,
        name=inst_in.name,
        code=inst_in.code,
        institute_type=inst_in.institute_type,
        state=inst_in.state,
        district=inst_in.district,
        address=inst_in.address,
        pin_code=inst_in.pin_code,
        contact_email=inst_in.contact_email,
        contact_phone=inst_in.contact_phone,
        website=inst_in.website,
        is_active=True
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    
    log_audit_event(
        db=db,
        action="INSTITUTION_CREATED",
        entity_type="INSTITUTION",
        entity_id=str(inst.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Created institution {inst.name} ({inst.aicte_id})"
    )
    
    return _build_institution_response(inst, db)

@router.put("/{institution_id}", response_model=InstitutionResponse)
def update_institution(
    institution_id: int,
    inst_in: InstitutionUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    update_data = inst_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(inst, field, val)
        
    db.commit()
    db.refresh(inst)
    
    log_audit_event(
        db=db,
        action="INSTITUTION_UPDATED",
        entity_type="INSTITUTION",
        entity_id=str(inst.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Admin updated institution details for {inst.name}"
    )
    
    return _build_institution_response(inst, db)

@router.patch("/{institution_id}/status", response_model=InstitutionResponse)
def toggle_institution_status(
    institution_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    inst.is_active = not inst.is_active
    db.commit()
    db.refresh(inst)
    
    action_text = "activated" if inst.is_active else "deactivated"
    log_audit_event(
        db=db,
        action="INSTITUTION_STATUS_TOGGLED",
        entity_type="INSTITUTION",
        entity_id=str(inst.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Institution {inst.name} {action_text}"
    )
    
    return _build_institution_response(inst, db)
