from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.ticket import TicketStatus

class UserPublic(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class TicketMessageBase(BaseModel):
    message: str

class TicketMessageCreate(TicketMessageBase):
    pass

class TicketMessageResponse(TicketMessageBase):
    id: int
    ticket_id: int
    sender_id: Optional[int] = None
    guest_sender: Optional[str] = None
    created_at: datetime
    sender: Optional[UserPublic] = None

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    subject: str

class TicketCreate(TicketBase):
    pass

class TicketGuestCreate(TicketBase):
    guest_email: str

class TicketResponse(TicketBase):
    id: int
    user_id: Optional[int] = None
    guest_email: Optional[str] = None
    token: Optional[str] = None
    status: TicketStatus
    created_at: datetime
    
    # We may not always load messages, so it's optional, but helpful for list views
    messages_count: Optional[int] = None
    user: Optional[UserPublic] = None

    class Config:
        from_attributes = True

class TicketDetailResponse(TicketResponse):
    messages: List[TicketMessageResponse] = []

    class Config:
        from_attributes = True
