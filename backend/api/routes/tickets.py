from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from api.dependencies import get_db
from api.deps import get_current_active_user, get_current_user
from models.user import User
from models.ticket import Ticket, TicketMessage, TicketStatus
from schemas.ticket import TicketCreate, TicketGuestCreate, TicketResponse, TicketDetailResponse, TicketMessageCreate, TicketMessageResponse
import secrets

router = APIRouter()

@router.get("", response_model=List[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all tickets for the currently logged in user.
    """
    tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).order_by(desc(Ticket.created_at)).all()
    return tickets

@router.post("", response_model=TicketResponse)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new support ticket.
    """
    ticket = Ticket(
        user_id=current_user.id,
        subject=ticket_in.subject,
        status=TicketStatus.OPEN.value
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific ticket and all its messages.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    return ticket

@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse)
def add_ticket_message(
    ticket_id: int,
    message_in: TicketMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Reply to a ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    if ticket.status == TicketStatus.CLOSED.value and not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")
        
    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=message_in.message
    )
    db.add(msg)
    
    # If a user replies to a ticket, maybe auto-reopen it, but for now we leave as is or let admin toggle.
    
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/guest", response_model=TicketResponse)
def create_guest_ticket(
    ticket_in: TicketGuestCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new support ticket without an account. Returns a secure token.
    """
    token = secrets.token_urlsafe(16)
    ticket = Ticket(
        guest_email=ticket_in.guest_email,
        subject=ticket_in.subject,
        status=TicketStatus.OPEN.value,
        token=token
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/guest/{token}", response_model=TicketDetailResponse)
def get_guest_ticket(
    token: str,
    db: Session = Depends(get_db)
):
    """
    View a guest ticket using its secure token.
    """
    ticket = db.query(Ticket).filter(Ticket.token == token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.post("/guest/{token}/messages", response_model=TicketMessageResponse)
def add_guest_ticket_message(
    token: str,
    message_in: TicketMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Reply to a guest ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.token == token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.status == TicketStatus.CLOSED.value:
        raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")
        
    msg = TicketMessage(
        ticket_id=ticket.id,
        guest_sender=ticket.guest_email,
        message=message_in.message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
