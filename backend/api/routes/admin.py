from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from api.dependencies import get_db
from api.deps import get_current_active_superuser
from models.user import User
from models.ticket import Ticket, TicketMessage, TicketStatus
from schemas.user import UserResponse, UserPlanUpdate
from schemas.ticket import TicketResponse, TicketDetailResponse

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser)
):
    """
    Retrieve all users.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser)
):
    """
    Delete a user completely. In a production app you might want to soft delete.
    """
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"ok": True}

@router.patch("/users/{user_id}/plan", response_model=UserResponse)
def update_user_plan(
    user_id: int,
    plan_update: UserPlanUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser)
):
    """
    Update a user's subscription plan.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.plan_id = plan_update.plan_id
    db.commit()
    db.refresh(user)
    return user

@router.get("/tickets", response_model=List[TicketResponse])
def get_all_tickets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser)
):
    """
    Get all tickets across the system for admins.
    """
    tickets = db.query(Ticket).order_by(desc(Ticket.created_at)).offset(skip).limit(limit).all()
    return tickets

@router.patch("/tickets/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status: TicketStatus,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_superuser)
):
    """
    Close or reopen a ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.status = status.value
    db.commit()
    db.refresh(ticket)
    return ticket
