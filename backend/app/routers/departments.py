from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.department import Department
from app.models.complaint import Complaint, ComplaintStatus
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse
)
from app.services.auth import get_current_user, require_admin
from app.services.audit import log_audit_event

router = APIRouter(prefix="/departments", tags=["Departments & Bureaus"])

def _format_department(dept: Department, db: Session) -> DepartmentResponse:
    active = db.query(func.count(Complaint.id)).filter(
        Complaint.assigned_department_id == dept.id,
        Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.REJECTED])
    ).scalar() or 0
    
    resolved = db.query(func.count(Complaint.id)).filter(
        Complaint.assigned_department_id == dept.id,
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])
    ).scalar() or 0

    return DepartmentResponse(
        id=dept.id,
        code=dept.code,
        name=dept.name,
        description=dept.description,
        contact_email=dept.contact_email,
        is_active=dept.is_active,
        created_at=dept.created_at,
        active_complaints_count=active,
        resolved_complaints_count=resolved
    )

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name.asc()).all()
    return [_format_department(d, db) for d in departments]

@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return _format_department(dept, db)

@router.post("", response_model=DepartmentResponse)
def create_department(
    dept_in: DepartmentCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if db.query(Department).filter(Department.code == dept_in.code).first():
        raise HTTPException(status_code=400, detail="Department with this code already exists")
        
    dept = Department(
        code=dept_in.code,
        name=dept_in.name,
        description=dept_in.description,
        contact_email=dept_in.contact_email,
        is_active=True
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    log_audit_event(
        db=db,
        action="DEPARTMENT_CREATED",
        entity_type="DEPARTMENT",
        entity_id=str(dept.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Created department {dept.name} ({dept.code})"
    )
    return _format_department(dept, db)

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    dept_in: DepartmentUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    update_data = dept_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(dept, field, val)
        
    db.commit()
    db.refresh(dept)
    
    log_audit_event(
        db=db,
        action="DEPARTMENT_UPDATED",
        entity_type="DEPARTMENT",
        entity_id=str(dept.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Admin updated department {dept.name}"
    )
    return _format_department(dept, db)
