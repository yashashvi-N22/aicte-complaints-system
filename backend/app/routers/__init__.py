from app.routers.auth import router as auth_router
from app.routers.institutions import router as institutions_router
from app.routers.departments import router as departments_router
from app.routers.complaints import router as complaints_router
from app.routers.duplicates import router as duplicates_router
from app.routers.analytics import router as analytics_router
from app.routers.audit import router as audit_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "institutions_router",
    "departments_router",
    "complaints_router",
    "duplicates_router",
    "analytics_router",
    "audit_router",
    "notifications_router",
]
