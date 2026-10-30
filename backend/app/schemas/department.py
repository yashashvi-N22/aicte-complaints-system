from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: int
    is_active: bool
    created_at: datetime
    active_complaints_count: int = 0
    resolved_complaints_count: int = 0

    class Config:
        from_attributes = True
