from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List
from core.config import settings
import logging

logger = logging.getLogger(__name__)

# Development-only stub connection config 
# In production, these should be real SMTP credentials read from settings
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME if hasattr(settings, 'MAIL_USERNAME') else "user@example.com",
    MAIL_PASSWORD=settings.MAIL_PASSWORD if hasattr(settings, 'MAIL_PASSWORD') else "password",
    MAIL_FROM=settings.MAIL_FROM if hasattr(settings, 'MAIL_FROM') else "noreply@cloudvault.com",
    MAIL_PORT=settings.MAIL_PORT if hasattr(settings, 'MAIL_PORT') else 587,
    MAIL_SERVER=settings.MAIL_SERVER if hasattr(settings, 'MAIL_SERVER') else "smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_password_reset_email(email_to: EmailStr, code: str):
    """
    Simulates sending an email with the 6-digit password reset code.
    In development, it prints the code to the console to avoid SMTP setup requirements.
    """
    # For development purposes: we just log it.
    print(f"\n" + "="*50)
    print(f"📧 EMAIL MOCK SENT TO: {email_to}")
    print(f"SUBJECT: CloudVault Password Reset Code")
    print(f"BODY:")
    print(f"Your password reset code is: {code}")
    print(f"This code will expire in 15 minutes.")
    print("="*50 + "\n")
    
    # In a real setup, uncomment these lines to actually send the email:
    # message = MessageSchema(
    #     subject="CloudVault Password Reset Code",
    #     recipients=[email_to],
    #     body=f"Your password reset code is: {code}\nThis code will expire in 15 minutes.",
    #     subtype=MessageType.plain
    # )
    # fm = FastMail(conf)
    # await fm.send_message(message)
    # logger.info(f"Password reset email sent to {email_to}")
    
    return True
