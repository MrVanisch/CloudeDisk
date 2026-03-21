from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate
from core.security import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_in: UserCreate):
    hashed_password = get_password_hash(user_in.password)
    # Default plan logic can be expanded later
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        plan_id=None,
        current_storage_used=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
