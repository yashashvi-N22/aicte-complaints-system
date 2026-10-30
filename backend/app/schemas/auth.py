from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.INST_REP
    phone: Optional[str] = None
    designation: Optional[str] = None
    institution_id: Optional[int] = None
    department_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    role: Optional[UserRole] = None
    institution_id: Optional[int] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserSimpleResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    designation: Optional[str] = None
    institution_id: Optional[int] = None
    department_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    designation: Optional[str] = None
    institution_id: Optional[int] = None
    department_id: Optional[int] = None
    institution_name: Optional[str] = None
    department_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
