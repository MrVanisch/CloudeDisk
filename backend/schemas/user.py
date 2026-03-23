import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

ALLOWED_DOMAINS = {
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
    'aol.com', 'protonmail.com', 'pm.me', 'zoho.com', 'yandex.com', 'mail.com',
    'wp.pl', 'onet.pl', 'o2.pl', 'interia.pl', 'gazeta.pl', 'tlen.pl', 'vp.pl'
}

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str

    @field_validator('email')
    def validate_email_domain(cls, v):
        domain = v.split('@')[-1].lower()
        if domain not in ALLOWED_DOMAINS:
            raise ValueError(f"Registration from domain '{domain}' is not allowed. Please use a well-known email provider (e.g., Gmail, Outlook, WP, Onet).")
        return v

    @field_validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_superuser: bool
    plan_id: Optional[int]
    current_storage_used: int
    
    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class UserPlanUpdate(BaseModel):
    plan_id: Optional[int]
