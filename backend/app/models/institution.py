import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class InstituteType(str, enum.Enum):
    ENGINEERING = "ENGINEERING"
    MANAGEMENT = "MANAGEMENT"
    PHARMACY = "PHARMACY"
    POLYTECHNIC = "POLYTECHNIC"
    ARCHITECTURE = "ARCHITECTURE"
    APPLIED_ARTS = "APPLIED_ARTS"
    HOTEL_MANAGEMENT = "HOTEL_MANAGEMENT"
    OTHER = "OTHER"

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    aicte_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=True)
    institute_type = Column(Enum(InstituteType), nullable=False, default=InstituteType.ENGINEERING)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    address = Column(Text, nullable=False)
    pin_code = Column(String(10), nullable=False)
    contact_email = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    website = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    representatives = relationship("User", back_populates="institution")
    complaints = relationship("Complaint", back_populates="institution", cascade="all, delete-orphan")
