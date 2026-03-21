import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.session import Base

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    guest_email = Column(String, nullable=True, index=True)
    token = Column(String, unique=True, index=True, nullable=True) # for guest tracking
    subject = Column(String, nullable=False)
    status = Column(String, default=TicketStatus.OPEN.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("models.user.User", backref="tickets")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    guest_sender = Column(String, nullable=True) # e.g. "Guest"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("models.user.User", backref="ticket_messages")
