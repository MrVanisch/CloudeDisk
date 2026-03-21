from sqlalchemy import Column, Integer, String, Boolean, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    current_storage_used = Column(BigInteger, default=0)
    reset_code = Column(String, nullable=True)
    reset_code_expires_at = Column(DateTime(timezone=True), nullable=True)

    plan = relationship("Plan", back_populates="users")
    files = relationship("models.file.File", back_populates="owner")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g. Free, Premium, Premium Plus
    max_storage_bytes = Column(BigInteger, nullable=False)
    
    users = relationship("User", back_populates="plan")
