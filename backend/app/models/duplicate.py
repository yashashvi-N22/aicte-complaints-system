import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class DuplicateReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED_DUPLICATE = "CONFIRMED_DUPLICATE"
    REJECTED_DUPLICATE = "REJECTED_DUPLICATE"

class DuplicateSuggestion(Base):
    __tablename__ = "duplicate_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    potential_duplicate_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    
    similarity_score = Column(Float, nullable=False)
    matched_keywords = Column(Text, nullable=True)
    status = Column(Enum(DuplicateReviewStatus), default=DuplicateReviewStatus.PENDING, nullable=False, index=True)
    
    suggested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    complaint = relationship("Complaint", foreign_keys=[complaint_id], back_populates="duplicate_suggestions_as_main")
    potential_duplicate = relationship("Complaint", foreign_keys=[potential_duplicate_id], back_populates="duplicate_suggestions_as_candidate")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_user_id])
