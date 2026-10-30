from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.complaint import ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.schemas.auth import UserSimpleResponse

class ComplaintCreate(BaseModel):
    institution_id: Optional[int] = None  # If submitted by INST_REP, taken from user's institution
    title: str
    description: str
    category: ComplaintCategory
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    reference_number: Optional[str] = None
    academic_year: str = "2026-2027"

class ComplaintStatusChange(BaseModel):
    status: ComplaintStatus
    comments: str

class ComplaintAssign(BaseModel):
    department_id: int
    assigned_officer_id: Optional[int] = None
    instructions: Optional[str] = None

class ComplaintHistoryResponse(BaseModel):
    id: int
    from_status: Optional[str]
    to_status: str
    comments: str
    changed_by_name: Optional[str] = None
    changed_by_role: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintAssignmentResponse(BaseModel):
    id: int
    department_id: int
    department_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_by_name: Optional[str] = None
    instructions: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    institution_id: int
    institution_name: Optional[str] = None
    institution_aicte_id: Optional[str] = None
    institution_state: Optional[str] = None
    title: str
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    reference_number: Optional[str] = None
    academic_year: str
    assigned_department_id: Optional[int] = None
    assigned_department_name: Optional[str] = None
    assigned_officer_id: Optional[int] = None
    assigned_officer_name: Optional[str] = None
    is_duplicate: bool
    primary_complaint_id: Optional[int] = None
    primary_complaint_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    description: str
    complainant_name: Optional[str] = None
    complainant_email: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_date: Optional[datetime] = None
    status_history: List[ComplaintHistoryResponse] = []
    assignments: List[ComplaintAssignmentResponse] = []
    potential_duplicate_count: int = 0

    class Config:
        from_attributes = True

class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
