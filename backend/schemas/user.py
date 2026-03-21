from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str

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
