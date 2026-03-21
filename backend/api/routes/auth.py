from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

from api.dependencies import get_db
from schemas.user import UserCreate, UserResponse
from schemas.token import Token
from services.user_service import create_user, get_user_by_email
from core.security import verify_password, create_access_token
from core.config import settings
from api.deps import get_current_active_user

router = APIRouter()

import httpx

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with reCAPTCHA verification.
    """
    # 1. Verify reCAPTCHA token
    async with httpx.AsyncClient() as client:
        recaptcha_response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": settings.RECAPTCHA_SECRET_KEY,
                "response": user_in.captcha_token
            }
        )
        
    result = recaptcha_response.json()
    if not result.get("success"):
        error_codes = result.get("error-codes", [])
        logger.warning(f"Registration failed: Invalid CAPTCHA. Details: {result}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CAPTCHA validation. Reason: {error_codes}"
        )

    # 2. Check if user exists
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
        
    # 3. Create user
    user = create_user(db, user_in=user_in)
    return user

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    print(f"DEBUG: Login attempt for user: {form_data.username}")
    user = get_user_by_email(db, email=form_data.username) # OAuth2 form uses 'username'
    if not user:
        print(f"DEBUG: User NOT found in DB: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    print(f"DEBUG: User found: {user.email}, Hashed PW in DB: {user.hashed_password[:10]}...")
    if not verify_password(form_data.password, user.hashed_password):
        print(f"DEBUG: Password verification FAILED for user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    print(f"DEBUG: Successful login for user: {form_data.username}")
        
    if not user.is_active:
        logger.warning(f"Inactive user: {form_data.username}")
        raise HTTPException(status_code=400, detail="Inactive user")
        
    logger.info(f"Successful login for user: {form_data.username} (ID: {user.id})")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user=Depends(get_current_active_user)):
    """
    Get current user.
    """
    return current_user

import secrets
from datetime import datetime, timezone
from schemas.user import ForgotPasswordRequest, ResetPasswordRequest
from utils.email import send_password_reset_email
from core.security import get_password_hash

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a 6-digit reset code and send via email.
    """
    user = get_user_by_email(db, email=request.email)
    if user:
        # Generate 6-digit code
        reset_code = "".join([str(secrets.choice(range(10))) for _ in range(6)])
        
        # Set expiry for 15 minutes from now UTC
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        user.reset_code = reset_code
        user.reset_code_expires_at = expires_at
        db.commit()
        
        # Send email (mocked to console in dev)
        await send_password_reset_email(user.email, reset_code)
        logger.info(f"Password reset code generated for {user.email}")
    else:
        logger.warning(f"Password reset requested for non-existent email: {request.email}. Simulating delay.")
        
    return {"message": "If the email is registered, a password reset code has been sent."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verify reset code and update password.
    """
    user = get_user_by_email(db, email=request.email)
    
    if not user or user.reset_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid email or reset code.")
        
    # Check if code is expired
    if not user.reset_code_expires_at or datetime.now(timezone.utc) > user.reset_code_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
        
    # Valid code, update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_code = None
    user.reset_code_expires_at = None
    
    db.commit()
    logger.info(f"Password reset successfully for {user.email}")
    
    return {"message": "Password has been reset successfully."}
