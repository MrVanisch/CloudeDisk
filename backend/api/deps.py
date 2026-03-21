from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from core.config import settings
from api.dependencies import get_db
from models.user import User
from schemas.token import TokenPayload
import logging

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        logger.info(f"JWT decoded successfully for sub: {token_data.sub}")
    except (InvalidTokenError, ValidationError) as e:
        logger.error(f"JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    if token_data.sub is None:
        logger.warning("Token sub claim is missing")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    logger.info(f"Looking up user ID: {token_data.sub}")
    user = db.query(User).filter(User.id == int(token_data.sub)).first()
    if not user:
        logger.warning(f"User not found in database for ID: {token_data.sub}")
        raise HTTPException(status_code=404, detail="User not found")
    logger.info(f"User found: {user.email}")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user
