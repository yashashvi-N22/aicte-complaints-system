from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User, UserRole
from app.models.institution import Institution
from app.models.department import Department
from app.schemas.auth import (
    LoginRequest,
    Token,
    UserResponse,
    UserCreate,
    UserUpdate
)
from app.services.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_admin
)
from app.services.audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

def _format_user_response(user: User) -> UserResponse:
    inst_name = user.institution.name if user.institution else None
    dept_name = user.department.name if user.department else None
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        designation=user.designation,
        institution_id=user.institution_id,
        department_id=user.department_id,
        institution_name=inst_name,
        department_name=dept_name,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        or_(User.username == login_data.username, User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )
        
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "user_id": user.id}
    )
    
    log_audit_event(
        db=db,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        details=f"User {user.username} logged in successfully as {user.role.value}"
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=_format_user_response(user)
    )

# Also support standard OAuth2 form login for Swagger UI interactive testing
@router.post("/token", response_model=Token, include_in_schema=False)
def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None, db: Session = Depends(get_db)):
    login_data = LoginRequest(username=form_data.username, password=form_data.password)
    return login(login_data, request, db)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return _format_user_response(current_user)

@router.post("/bootstrap-admin", response_model=UserResponse)
def bootstrap_admin(request: Request, db: Session = Depends(get_db)):
    """
    Safe development-only method for provisioning the initial AICTE Administrator.
    Ensures safe initialization without hardcoding production credentials.
    """
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@aicte-india.org",
            full_name="AICTE Central Administrator",
            hashed_password=get_password_hash("Admin@AICTE2026"),
            role=UserRole.ADMIN,
            designation="Chief Systems Administrator",
            phone="011-29581000",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        log_audit_event(
            db=db,
            action="BOOTSTRAP_ADMIN",
            entity_type="USER",
            entity_id=str(admin.id),
            user_id=admin.id,
            ip_address=request.client.host if request.client else None,
            details="Initial admin account provisioned"
        )
    return _format_user_response(admin)

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[UserRole] = None,
    department_id: Optional[int] = None,
    institution_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if department_id:
        query = query.filter(User.department_id == department_id)
    if institution_id:
        query = query.filter(User.institution_id == institution_id)
        
    users = query.order_by(User.created_at.desc()).all()
    return [_format_user_response(u) for u in users]

@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone,
        designation=user_in.designation,
        institution_id=user_in.institution_id,
        department_id=user_in.department_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_audit_event(
        db=db,
        action="USER_CREATED",
        entity_type="USER",
        entity_id=str(user.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Admin created user {user.username} with role {user.role.value}"
    )
    return _format_user_response(user)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.email and user_in.email != user.email:
        if db.query(User).filter(User.email == user_in.email).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_in.email
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.phone is not None:
        user.phone = user_in.phone
    if user_in.designation is not None:
        user.designation = user_in.designation
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.institution_id is not None:
        user.institution_id = user_in.institution_id
    if user_in.department_id is not None:
        user.department_id = user_in.department_id
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
        
    db.commit()
    db.refresh(user)
    
    log_audit_event(
        db=db,
        action="USER_UPDATED",
        entity_type="USER",
        entity_id=str(user.id),
        user_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        details=f"Admin updated user {user.username}"
    )
    return _format_user_response(user)
