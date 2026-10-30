from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.institution import InstituteType

class InstitutionBase(BaseModel):
    aicte_id: str
    name: str
    code: Optional[str] = None
    institute_type: InstituteType = InstituteType.ENGINEERING
    state: str
    district: str
    address: str
    pin_code: str
    contact_email: EmailStr
    contact_phone: str
    website: Optional[str] = None

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    institute_type: Optional[InstituteType] = None
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    pin_code: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None

class InstitutionResponse(InstitutionBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    total_complaints: int = 0
    pending_complaints: int = 0
    resolved_complaints: int = 0

    class Config:
        from_attributes = True

class InstitutionListResponse(BaseModel):
    items: List[InstitutionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
