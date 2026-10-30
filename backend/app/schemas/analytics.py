from pydantic import BaseModel
from typing import List, Dict, Any

class CountItem(BaseModel):
    name: str
    count: int
    percentage: float = 0.0

class MonthlyTrendItem(BaseModel):
    month: str
    submitted: int
    resolved: int

class DepartmentWorkloadItem(BaseModel):
    department_id: int
    name: str
    code: str
    total_assigned: int
    in_progress: int
    resolved: int

class InstitutionStatItem(BaseModel):
    id: int
    name: str
    aicte_id: str
    state: str
    complaint_count: int

class DashboardStatsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    under_review_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    rejected_complaints: int
    duplicate_complaints: int
    total_institutions: int
    total_departments: int
    avg_resolution_days: float
    
    category_breakdown: List[CountItem]
    status_breakdown: List[CountItem]
    priority_breakdown: List[CountItem]
    monthly_trends: List[MonthlyTrendItem]
    department_workload: List[DepartmentWorkloadItem]
    top_institutions_by_complaints: List[InstitutionStatItem]
    state_breakdown: List[CountItem]
