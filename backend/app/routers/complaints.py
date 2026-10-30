import math
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.department import Department
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus
)
from app.models.complaint_history import ComplaintStatusHistory
from app.models.assignment import ComplaintAssignment
from app.models.coordination import DepartmentCoordination
from app.models.duplicate import DuplicateSuggestion, DuplicateReviewStatus
from app.models.notification import Notification
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintStatusChange,
    ComplaintAssign,
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintListResponse,
    ComplaintHistoryResponse,
    ComplaintAssignmentResponse,
)
from app.schemas.coordination import (
    CoordinationCreate,
    CoordinationRespond,
    CoordinationResponse,
)
from app.services.auth import get_current_user
from app.services.complaint_id import generate_complaint_id
from app.services.duplicate_detector import scan_duplicates_for_complaint
from app.services.audit import log_audit_event

router = APIRouter(prefix="/complaints", tags=["Complaint Management"])

def _format_complaint_response(c: Complaint) -> ComplaintResponse:
    primary_code = c.primary_complaint.complaint_id if c.primary_complaint else None
    return ComplaintResponse(
        id=c.id,
        complaint_id=c.complaint_id,
        institution_id=c.institution_id,
        institution_name=c.institution.name if c.institution else None,
        institution_aicte_id=c.institution.aicte_id if c.institution else None,
        institution_state=c.institution.state if c.institution else None,
        title=c.title,
        category=c.category,
        priority=c.priority,
        status=c.status,
        reference_number=c.reference_number,
        academic_year=c.academic_year,
        assigned_department_id=c.assigned_department_id,
        assigned_department_name=c.assigned_department.name if c.assigned_department else None,
        assigned_officer_id=c.assigned_officer_id,
        assigned_officer_name=c.assigned_officer.full_name if c.assigned_officer else None,
        is_duplicate=c.is_duplicate,
        primary_complaint_id=c.primary_complaint_id,
        primary_complaint_code=primary_code,
        created_at=c.created_at,
        updated_at=c.updated_at
    )

def _format_complaint_detail(c: Complaint, db: Session) -> ComplaintDetailResponse:
    base = _format_complaint_response(c)
    
    # Status history
    histories = []
    for h in c.status_history:
        histories.append(ComplaintHistoryResponse(
            id=h.id,
            from_status=h.from_status,
            to_status=h.to_status,
            comments=h.comments,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            changed_by_role=h.changed_by.role.value if h.changed_by else None,
            created_at=h.created_at
        ))
        
    # Assignments
    assignments = []
    for a in c.assignments:
        assignments.append(ComplaintAssignmentResponse(
            id=a.id,
            department_id=a.department_id,
            department_name=a.department.name if a.department else None,
            assigned_to_name=a.assigned_to.full_name if a.assigned_to else None,
            assigned_by_name=a.assigned_by.full_name if a.assigned_by else None,
            instructions=a.instructions,
            is_active=a.is_active,
            created_at=a.created_at
        ))
        
    # Duplicate suggestions count
    dup_count = db.query(DuplicateSuggestion).filter(
        or_(
            DuplicateSuggestion.complaint_id == c.id,
            DuplicateSuggestion.potential_duplicate_id == c.id
        ),
        DuplicateSuggestion.status == DuplicateReviewStatus.PENDING
    ).count()

    return ComplaintDetailResponse(
        **base.model_dump(),
        description=c.description,
        complainant_name=c.complainant.full_name if c.complainant else None,
        complainant_email=c.complainant.email if c.complainant else None,
        resolution_notes=c.resolution_notes,
        resolution_date=c.resolution_date,
        status_history=histories,
        assignments=assignments,
        potential_duplicate_count=dup_count
    )

@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    q: Optional[str] = Query(None, description="Search by tracking ID, title, or institution"),
    status: Optional[ComplaintStatus] = Query(None, description="Filter by status"),
    priority: Optional[ComplaintPriority] = Query(None, description="Filter by priority"),
    category: Optional[ComplaintCategory] = Query(None, description="Filter by category"),
    department_id: Optional[int] = Query(None, description="Filter by assigned department"),
    institution_id: Optional[int] = Query(None, description="Filter by institution"),
    is_duplicate: Optional[bool] = Query(None, description="Filter duplicates"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    # RBAC filtering
    if current_user.role == UserRole.INST_REP:
        if not current_user.institution_id:
            return ComplaintListResponse(items=[], total=0, page=page, page_size=page_size, total_pages=1)
        query = query.filter(Complaint.institution_id == current_user.institution_id)
    elif current_user.role == UserRole.DEPT_OFFICER:
        if current_user.department_id:
            query = query.filter(Complaint.assigned_department_id == current_user.department_id)
            
    # Apply query filters
    if q:
        search = f"%{q.strip()}%"
        query = query.join(Institution, Complaint.institution_id == Institution.id).filter(
            or_(
                Complaint.complaint_id.ilike(search),
                Complaint.title.ilike(search),
                Complaint.reference_number.ilike(search),
                Institution.name.ilike(search),
                Institution.aicte_id.ilike(search)
            )
        )
        
    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if category:
        query = query.filter(Complaint.category == category)
    if department_id:
        query = query.filter(Complaint.assigned_department_id == department_id)
    if institution_id:
        query = query.filter(Complaint.institution_id == institution_id)
    if is_duplicate is not None:
        query = query.filter(Complaint.is_duplicate == is_duplicate)
        
    total = query.count()
    offset = (page - 1) * page_size
    complaints = query.order_by(desc(Complaint.created_at)).offset(offset).limit(page_size).all()
    
    items = [_format_complaint_response(c) for c in complaints]
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    return ComplaintListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Check RBAC access
    if current_user.role == UserRole.INST_REP:
        if complaint.institution_id != current_user.institution_id:
            raise HTTPException(status_code=403, detail="Unauthorized to access records of another institution")
    elif current_user.role == UserRole.DEPT_OFFICER:
        if current_user.department_id and complaint.assigned_department_id != current_user.department_id:
            # Allow read if involved in coordination
            pass
            
    return _format_complaint_detail(complaint, db)

@router.post("", response_model=ComplaintDetailResponse)
def create_complaint(
    complaint_in: ComplaintCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Determine institution
    inst_id = complaint_in.institution_id
    if current_user.role == UserRole.INST_REP:
        if not current_user.institution_id:
            raise HTTPException(status_code=400, detail="User account is not linked to any institution")
        inst_id = current_user.institution_id
    elif not inst_id:
        raise HTTPException(status_code=400, detail="institution_id is required")
        
    institution = db.query(Institution).filter(Institution.id == inst_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Target institution not found")
        
    tracking_id = generate_complaint_id(db)
    
    complaint = Complaint(
        complaint_id=tracking_id,
        institution_id=inst_id,
        complainant_user_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        category=complaint_in.category,
        priority=complaint_in.priority,
        status=ComplaintStatus.SUBMITTED,
        reference_number=complaint_in.reference_number,
        academic_year=complaint_in.academic_year
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    # Record initial status in history
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=None,
        to_status=ComplaintStatus.SUBMITTED.value,
        changed_by_user_id=current_user.id,
        comments="Grievance filed officially through the AICTE Central Grievance Portal."
    )
    db.add(history)
    db.commit()
    
    # Run duplicate detection engine
    duplicate_suggestions = scan_duplicates_for_complaint(db, complaint)
    
    # Audit log
    log_audit_event(
        db=db,
        action="COMPLAINT_CREATED",
        entity_type="COMPLAINT",
        entity_id=str(complaint.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Grievance {tracking_id} submitted for {institution.name}. Potential duplicates detected: {len(duplicate_suggestions)}"
    )
    
    # Notification for institution rep
    notif = Notification(
        user_id=current_user.id,
        title="Grievance Registered Successfully",
        message=f"Your grievance has been assigned Tracking ID: {tracking_id}. It is currently under triage.",
        link=f"/complaints/{complaint.id}"
    )
    db.add(notif)
    db.commit()
    
    return _format_complaint_detail(complaint, db)

@router.post("/{complaint_id}/status", response_model=ComplaintDetailResponse)
def update_complaint_status(
    complaint_id: int,
    status_change: ComplaintStatusChange,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Check permissions
    if current_user.role == UserRole.INST_REP:
        raise HTTPException(status_code=403, detail="Institution representatives cannot modify complaint status")
        
    old_status = complaint.status.value
    new_status = status_change.status
    
    complaint.status = new_status
    if new_status in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        complaint.resolution_date = datetime.utcnow()
        complaint.resolution_notes = status_change.comments
        
    # Log to history
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=new_status.value,
        changed_by_user_id=current_user.id,
        comments=status_change.comments
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    
    # Notify complainant
    notif = Notification(
        user_id=complaint.complainant_user_id,
        title=f"Grievance {complaint.complaint_id} Status Updated",
        message=f"Status changed from {old_status} to {new_status.value}. Officer remarks: {status_change.comments}",
        link=f"/complaints/{complaint.id}"
    )
    db.add(notif)
    db.commit()
    
    log_audit_event(
        db=db,
        action="COMPLAINT_STATUS_UPDATED",
        entity_type="COMPLAINT",
        entity_id=str(complaint.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Status changed from {old_status} to {new_status.value} for {complaint.complaint_id}"
    )
    
    return _format_complaint_detail(complaint, db)

@router.post("/{complaint_id}/assign", response_model=ComplaintDetailResponse)
def assign_complaint(
    complaint_id: int,
    assign_in: ComplaintAssign,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.REVIEWER]:
        raise HTTPException(status_code=403, detail="Only Reviewers or Administrators can assign complaints")
        
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    dept = db.query(Department).filter(Department.id == assign_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Target department not found")
        
    # Deactivate previous active assignments
    db.query(ComplaintAssignment).filter(
        ComplaintAssignment.complaint_id == complaint.id,
        ComplaintAssignment.is_active == True
    ).update({"is_active": False})
    
    assignment = ComplaintAssignment(
        complaint_id=complaint.id,
        department_id=dept.id,
        assigned_to_user_id=assign_in.assigned_officer_id,
        assigned_by_user_id=current_user.id,
        instructions=assign_in.instructions,
        is_active=True
    )
    db.add(assignment)
    
    old_status = complaint.status.value
    complaint.assigned_department_id = dept.id
    complaint.assigned_officer_id = assign_in.assigned_officer_id
    complaint.status = ComplaintStatus.ASSIGNED
    
    # Log status history
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=ComplaintStatus.ASSIGNED.value,
        changed_by_user_id=current_user.id,
        comments=f"Routed and assigned to Bureau: {dept.name}. Instructions: {assign_in.instructions or 'Standard inquiry'}"
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    
    log_audit_event(
        db=db,
        action="COMPLAINT_ASSIGNED",
        entity_type="COMPLAINT",
        entity_id=str(complaint.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Assigned {complaint.complaint_id} to {dept.name}"
    )
    
    return _format_complaint_detail(complaint, db)

@router.get("/{complaint_id}/coordinations", response_model=List[CoordinationResponse])
def get_complaint_coordinations(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    coordinations = db.query(DepartmentCoordination).filter(
        DepartmentCoordination.complaint_id == complaint_id
    ).order_by(DepartmentCoordination.created_at.desc()).all()
    
    items = []
    for c in coordinations:
        items.append(CoordinationResponse(
            id=c.id,
            complaint_id=c.complaint_id,
            complaint_code=complaint.complaint_id,
            from_department_id=c.from_department_id,
            from_department_name=c.from_department.name if c.from_department else None,
            to_department_id=c.to_department_id,
            to_department_name=c.to_department.name if c.to_department else None,
            initiated_by_name=c.initiated_by.full_name if c.initiated_by else None,
            subject=c.subject,
            message=c.message,
            response_message=c.response_message,
            responded_by_name=c.responded_by.full_name if c.responded_by else None,
            responded_at=c.responded_at,
            status=c.status,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
    return items

@router.post("/{complaint_id}/coordinations", response_model=CoordinationResponse)
def create_coordination(
    complaint_id: int,
    coord_in: CoordinationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.DEPT_OFFICER, UserRole.REVIEWER]:
        raise HTTPException(status_code=403, detail="Unauthorized to initiate inter-bureau coordination")
        
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    from_dept_id = current_user.department_id or complaint.assigned_department_id or 1
    
    coord = DepartmentCoordination(
        complaint_id=complaint_id,
        from_department_id=from_dept_id,
        to_department_id=coord_in.to_department_id,
        initiated_by_user_id=current_user.id,
        subject=coord_in.subject,
        message=coord_in.message,
        status="OPEN"
    )
    db.add(coord)
    db.commit()
    db.refresh(coord)
    
    return CoordinationResponse(
        id=coord.id,
        complaint_id=coord.complaint_id,
        complaint_code=complaint.complaint_id,
        from_department_id=coord.from_department_id,
        from_department_name=coord.from_department.name if coord.from_department else None,
        to_department_id=coord.to_department_id,
        to_department_name=coord.to_department.name if coord.to_department else None,
        initiated_by_name=current_user.full_name,
        subject=coord.subject,
        message=coord.message,
        response_message=None,
        responded_by_name=None,
        responded_at=None,
        status=coord.status,
        created_at=coord.created_at,
        updated_at=coord.updated_at
    )

@router.post("/coordinations/{coord_id}/respond", response_model=CoordinationResponse)
def respond_coordination(
    coord_id: int,
    resp_in: CoordinationRespond,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coord = db.query(DepartmentCoordination).filter(DepartmentCoordination.id == coord_id).first()
    if not coord:
        raise HTTPException(status_code=404, detail="Coordination request not found")
        
    coord.response_message = resp_in.response_message
    coord.responded_by_user_id = current_user.id
    coord.responded_at = datetime.utcnow()
    if resp_in.mark_resolved:
        coord.status = "RESOLVED"
        
    db.commit()
    db.refresh(coord)
    
    return CoordinationResponse(
        id=coord.id,
        complaint_id=coord.complaint_id,
        complaint_code=coord.complaint.complaint_id if coord.complaint else None,
        from_department_id=coord.from_department_id,
        from_department_name=coord.from_department.name if coord.from_department else None,
        to_department_id=coord.to_department_id,
        to_department_name=coord.to_department.name if coord.to_department else None,
        initiated_by_name=coord.initiated_by.full_name if coord.initiated_by else None,
        subject=coord.subject,
        message=coord.message,
        response_message=coord.response_message,
        responded_by_name=current_user.full_name,
        responded_at=coord.responded_at,
        status=coord.status,
        created_at=coord.created_at,
        updated_at=coord.updated_at
    )
