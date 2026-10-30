from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CoordinationCreate(BaseModel):
    complaint_id: int
    to_department_id: int
    subject: str
    message: str

class CoordinationRespond(BaseModel):
    response_message: str
    mark_resolved: bool = True

class CoordinationResponse(BaseModel):
    id: int
    complaint_id: int
    complaint_code: Optional[str] = None
    from_department_id: int
    from_department_name: Optional[str] = None
    to_department_id: int
    to_department_name: Optional[str] = None
    initiated_by_name: Optional[str] = None
    subject: str
    message: str
    response_message: Optional[str] = None
    responded_by_name: Optional[str] = None
    responded_at: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
