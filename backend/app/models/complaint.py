import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ComplaintCategory(str, enum.Enum):
    APPROVAL_AFFILIATION = "APPROVAL_AFFILIATION"
    FACULTY_STAFF = "FACULTY_STAFF"
    STUDENT_FEES = "STUDENT_FEES"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    ANTI_RAGGING = "ANTI_RAGGING"
    FUNDS_SCHOLARSHIP = "FUNDS_SCHOLARSHIP"
    EXAM_CURRICULUM = "EXAM_CURRICULUM"
    GOVERNANCE_CORRUPTION = "GOVERNANCE_CORRUPTION"
    OTHER = "OTHER"

class ComplaintPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_INSTITUTION = "PENDING_INSTITUTION"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    DUPLICATE = "DUPLICATE"
    CLOSED = "CLOSED"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True, nullable=False)
    
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    complainant_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), nullable=False, index=True)
    priority = Column(Enum(ComplaintPriority), nullable=False, default=ComplaintPriority.MEDIUM, index=True)
    status = Column(Enum(ComplaintStatus), nullable=False, default=ComplaintStatus.SUBMITTED, index=True)
    
    reference_number = Column(String(100), nullable=True)
    academic_year = Column(String(20), default="2026-2027", nullable=False)
    
    assigned_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    resolution_notes = Column(Text, nullable=True)
    resolution_date = Column(DateTime, nullable=True)
    
    is_duplicate = Column(Boolean, default=False, nullable=False, index=True)
    primary_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    institution = relationship("Institution", back_populates="complaints")
    complainant = relationship("User", back_populates="complaints_filed", foreign_keys=[complainant_user_id])
    assigned_department = relationship("Department", back_populates="complaints")
    assigned_officer = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_officer_id])
    
    primary_complaint = relationship("Complaint", remote_side=[id], backref="linked_duplicates")
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintStatusHistory.created_at.desc()")
    assignments = relationship("ComplaintAssignment", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintAssignment.created_at.desc()")
    coordinations = relationship("DepartmentCoordination", back_populates="complaint", cascade="all, delete-orphan", order_by="DepartmentCoordination.created_at.desc()")
    
    duplicate_suggestions_as_main = relationship("DuplicateSuggestion", foreign_keys="DuplicateSuggestion.complaint_id", back_populates="complaint", cascade="all, delete-orphan")
    duplicate_suggestions_as_candidate = relationship("DuplicateSuggestion", foreign_keys="DuplicateSuggestion.potential_duplicate_id", back_populates="potential_duplicate", cascade="all, delete-orphan")
