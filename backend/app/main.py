from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Base, engine
from app.seed import seed_database
from app.routers import (
    auth_router,
    institutions_router,
    departments_router,
    complaints_router,
    duplicates_router,
    analytics_router,
    audit_router,
    notifications_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed sample data on startup
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title="AICTE Integrated Institution Complaint Monitoring & Status Dashboard API",
    description="""
    ## Official Central Portal for AICTE Technical Institution Grievance Redressal
    
    *Notice: Demonstration prototype — not an official AICTE service.*
    
    ### Core Capabilities:
    * **Role-Based Access Control (RBAC):** Administrator, Department Officer, Institution Representative, Reviewer.
    * **Grievance Lifecycle Management:** Tracking IDs, historical status auditing, bureau routing.
    * **Duplicate Detection:** Automatic similarity scoring & Reviewer adjudication workflow.
    * **Institution Directory:** Search, state/district filtering, complaint history auditing.
    * **Inter-Bureau Coordination:** Cross-department communication & remarks.
    * **Analytics:** Recharts data feeds for trends, workload, and resolution performance.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(institutions_router, prefix=settings.API_V1_PREFIX)
app.include_router(departments_router, prefix=settings.API_V1_PREFIX)
app.include_router(complaints_router, prefix=settings.API_V1_PREFIX)
app.include_router(duplicates_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications_router, prefix=settings.API_V1_PREFIX)

@app.get("/api/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "AICTE Complaint Monitoring System",
        "environment": settings.APP_ENV,
        "disclaimer": "Demonstration prototype — not an official AICTE service."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
