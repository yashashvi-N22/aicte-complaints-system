from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.complaint_history import ComplaintStatusHistory
from app.models.duplicate import DuplicateSuggestion, DuplicateReviewStatus
from app.schemas.duplicate import (
    DuplicateSuggestionResponse,
    DuplicateReviewDecision
)
from app.services.auth import require_reviewer
from app.services.duplicate_detector import scan_duplicates_for_complaint
from app.services.audit import log_audit_event

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection & Review"])

def _format_duplicate_suggestion(s: DuplicateSuggestion) -> DuplicateSuggestionResponse:
    c1 = s.complaint
    c2 = s.potential_duplicate
    return DuplicateSuggestionResponse(
        id=s.id,
        complaint_id=c1.id,
        complaint_code=c1.complaint_id,
        complaint_title=c1.title,
        complaint_category=c1.category.value,
        complaint_institution_name=c1.institution.name if c1.institution else "N/A",
        complaint_created_at=c1.created_at,
        potential_duplicate_id=c2.id,
        potential_code=c2.complaint_id,
        potential_title=c2.title,
        potential_category=c2.category.value,
        potential_institution_name=c2.institution.name if c2.institution else "N/A",
        potential_created_at=c2.created_at,
        similarity_score=s.similarity_score,
        matched_keywords=s.matched_keywords,
        status=s.status,
        suggested_at=s.suggested_at,
        reviewed_by_name=s.reviewed_by.full_name if s.reviewed_by else None,
        review_notes=s.review_notes,
        reviewed_at=s.reviewed_at
    )

@router.get("", response_model=List[DuplicateSuggestionResponse])
def list_duplicate_suggestions(
    status: Optional[DuplicateReviewStatus] = Query(None, description="Filter by review status"),
    current_user: User = Depends(require_reviewer),
    db: Session = Depends(get_db)
):
    query = db.query(DuplicateSuggestion)
    if status:
        query = query.filter(DuplicateSuggestion.status == status)
    else:
        # Default show pending first
        pass
        
    suggestions = query.order_by(
        desc(DuplicateSuggestion.status == DuplicateReviewStatus.PENDING),
        desc(DuplicateSuggestion.similarity_score)
    ).all()
    
    return [_format_duplicate_suggestion(s) for s in suggestions]

@router.post("/{suggestion_id}/review", response_model=DuplicateSuggestionResponse)
def review_duplicate_suggestion(
    suggestion_id: int,
    decision: DuplicateReviewDecision,
    request: Request,
    current_user: User = Depends(require_reviewer),
    db: Session = Depends(get_db)
):
    suggestion = db.query(DuplicateSuggestion).filter(DuplicateSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Duplicate suggestion not found")
        
    suggestion.status = decision.status
    suggestion.review_notes = decision.review_notes
    suggestion.reviewed_by_user_id = current_user.id
    suggestion.reviewed_at = datetime.utcnow()
    
    c1 = suggestion.complaint
    c2 = suggestion.potential_duplicate
    
    if decision.status == DuplicateReviewStatus.CONFIRMED_DUPLICATE:
        # If confirmed duplicate: primary is designated by decision, or by creation timestamp
        if decision.primary_complaint_id == c2.id:
            primary_complaint = c2
            duplicate_complaint = c1
        else:
            # Default: older one is primary, newer is duplicate
            if c1.created_at <= c2.created_at:
                primary_complaint = c1
                duplicate_complaint = c2
            else:
                primary_complaint = c2
                duplicate_complaint = c1
                
        duplicate_complaint.is_duplicate = True
        duplicate_complaint.primary_complaint_id = primary_complaint.id
        old_status = duplicate_complaint.status.value
        duplicate_complaint.status = ComplaintStatus.DUPLICATE
        
        # Add history log
        history = ComplaintStatusHistory(
            complaint_id=duplicate_complaint.id,
            from_status=old_status,
            to_status=ComplaintStatus.DUPLICATE.value,
            changed_by_user_id=current_user.id,
            comments=f"Confirmed duplicate of primary grievance {primary_complaint.complaint_id}. Reviewer notes: {decision.review_notes}"
        )
        db.add(history)
        
        log_audit_event(
            db=db,
            action="DUPLICATE_CONFIRMED",
            entity_type="DUPLICATE_SUGGESTION",
            entity_id=str(suggestion.id),
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
            details=f"Grievance {duplicate_complaint.complaint_id} confirmed as duplicate of {primary_complaint.complaint_id}"
        )
    else:
        log_audit_event(
            db=db,
            action="DUPLICATE_REJECTED",
            entity_type="DUPLICATE_SUGGESTION",
            entity_id=str(suggestion.id),
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
            details=f"Duplicate suggestion #{suggestion.id} rejected. Reviewer notes: {decision.review_notes}"
        )
        
    db.commit()
    db.refresh(suggestion)
    return _format_duplicate_suggestion(suggestion)

@router.post("/scan-all", response_model=dict)
def trigger_full_duplicate_scan(
    current_user: User = Depends(require_reviewer),
    db: Session = Depends(get_db)
):
    """Admin / Reviewer manual trigger to re-scan open complaints for duplicates"""
    active_complaints = db.query(Complaint).filter(
        Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.REJECTED])
    ).all()
    
    total_new_suggestions = 0
    for complaint in active_complaints:
        new_suggs = scan_duplicates_for_complaint(db, complaint)
        total_new_suggestions += len(new_suggs)
        
    return {
        "status": "success",
        "scanned_complaints_count": len(active_complaints),
        "new_duplicate_suggestions_found": total_new_suggestions
    }
