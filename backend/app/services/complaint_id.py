from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.complaint import Complaint

def generate_complaint_id(db: Session) -> str:
    current_year = datetime.utcnow().year
    prefix = f"AICTE-{current_year}-"
    
    # Count existing complaints for this year to make sequential ID
    count = db.query(func.count(Complaint.id)).filter(
        Complaint.complaint_id.like(f"{prefix}%")
    ).scalar() or 0
    
    next_num = count + 1
    return f"{prefix}{next_num:05d}"
