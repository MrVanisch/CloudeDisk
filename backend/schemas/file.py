from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models.file import ConversionStatus

class FileResponse(BaseModel):
    id: int
    original_filename: str
    size_bytes: int
    mime_type: str
    conversion_status: ConversionStatus
    share_token: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class FileShareResponse(BaseModel):
    share_token: str
    share_url: str
