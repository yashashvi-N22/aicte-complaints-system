from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.duplicate import DuplicateReviewStatus

class DuplicateSuggestionResponse(BaseModel):
    id: int
    complaint_id: int
    complaint_code: str
    complaint_title: str
    complaint_category: str
    complaint_institution_name: str
    complaint_created_at: datetime
    
    potential_duplicate_id: int
    potential_code: str
    potential_title: str
    potential_category: str
    potential_institution_name: str
    potential_created_at: datetime
    
    similarity_score: float
    matched_keywords: Optional[str] = None
    status: DuplicateReviewStatus
    suggested_at: datetime
    
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DuplicateReviewDecision(BaseModel):
    status: DuplicateReviewStatus  # CONFIRMED_DUPLICATE or REJECTED_DUPLICATE
    primary_complaint_id: Optional[int] = None
    review_notes: str
