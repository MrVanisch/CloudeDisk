from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from api.dependencies import get_db
from models.user import Plan
from pydantic import BaseModel

router = APIRouter()

class PlanResponse(BaseModel):
    id: int
    name: str
    max_storage_bytes: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    """
    Get all available storage plans.
    """
    return db.query(Plan).all()
