from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
import enum
import datetime
from db.session import Base

class ConversionStatus(str, enum.Enum):
    NONE = "none"
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False) # Name on disk (encrypted)
    size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String, nullable=False)
    
    conversion_status = Column(Enum(ConversionStatus), default=ConversionStatus.NONE)
    share_token = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="files")
