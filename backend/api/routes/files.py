import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime

from api.dependencies import get_db
from api.deps import get_current_active_user
from models.user import User, Plan
from models.file import File, ConversionStatus
from schemas.file import FileResponse, FileShareResponse
from services.encryption_service import encrypt_file, decrypt_stream
from services.conversion_service import process_conversion
from core.config import settings
from core.config import settings

router = APIRouter()
UPLOAD_DIR = os.path.join(os.getcwd(), "storage")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Encrypt and upload a file. Validates storage limits before accepting.
    """
    # 1. Check storage limits
    user_plan = db.query(Plan).filter(Plan.id == current_user.plan_id).first()
    max_storage = user_plan.max_storage_bytes if user_plan else 1024 * 1024 * 1024 # default 1GB
    
    # We read the size up front for smallish files, but for streaming we should check dynamically
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if current_user.current_storage_used + file_size > max_storage:
        raise HTTPException(status_code=400, detail="Storage limit exceeded. Upgrade your plan.")
        
    # 2. Save file temporarily
    temp_filename = f"{uuid.uuid4()}_temp_{file.filename}"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
    
    with open(temp_filepath, "wb") as f:
        while chunk := await file.read(1024 * 1024): # 1MB chunks
            f.write(chunk)
            
    # 3. Encrypt file
    stored_filename = f"{uuid.uuid4()}.enc"
    stored_filepath = os.path.join(UPLOAD_DIR, stored_filename)
    
    encrypt_file(temp_filepath, stored_filepath)
    os.remove(temp_filepath) # clean up temporary unencrypted file
    
    # Update DB
    db_file = File(
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        size_bytes=file_size,
        mime_type=file.content_type,
        conversion_status=ConversionStatus.NONE
    )
    db.add(db_file)
    current_user.current_storage_used += file_size
    db.commit()
    db.refresh(db_file)
    
    return db_file

@router.get("", response_model=List[FileResponse])
def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List all files for the current user.
    """
    files = db.query(File).filter(File.user_id == current_user.id).all()
    return files

@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download and decrypt a file on the fly.
    """
    file = db.query(File).filter(File.id == file_id, File.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    filepath = os.path.join(UPLOAD_DIR, file.stored_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File data missing on disk")
        
    headers = {
        'Content-Disposition': f'attachment; filename="{file.original_filename}"',
        'Content-Length': str(file.size_bytes)
    }
    return StreamingResponse(decrypt_stream(filepath), media_type=file.mime_type, headers=headers)

@router.post("/{file_id}/convert/{target_format}", response_model=FileResponse)
def start_conversion(
    file_id: int,
    target_format: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Queue a file for conversion to a new format.
    """
    file = db.query(File).filter(File.id == file_id, File.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if file.conversion_status in [ConversionStatus.PENDING, ConversionStatus.PROCESSING]:
        raise HTTPException(status_code=400, detail="File is already queued for conversion")
        
    file.conversion_status = ConversionStatus.PENDING
    db.commit()
    db.refresh(file)
    
    background_tasks.add_task(process_conversion, file.id, target_format)
    return file

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    file = db.query(File).filter(File.id == file_id, File.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    filepath = os.path.join(UPLOAD_DIR, file.stored_filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        
    current_user.current_storage_used -= file.size_bytes
    if current_user.current_storage_used < 0:
        current_user.current_storage_used = 0
        
    db.delete(file)
    db.commit()
    return None

@router.post("/{file_id}/share", response_model=FileShareResponse)
def share_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a shareable link for a file.
    """
    file = db.query(File).filter(File.id == file_id, File.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if not file.share_token:
        file.share_token = str(uuid.uuid4())
        db.commit()
        db.refresh(file)
        
    return {
        "share_token": file.share_token,
        "share_url": f"/api/v1/files/shared/{file.share_token}"
    }

@router.post("/{file_id}/unshare", response_model=FileResponse)
def unshare_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Revoke a generated shareable link.
    """
    file = db.query(File).filter(File.id == file_id, File.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    file.share_token = None
    db.commit()
    db.refresh(file)
    return file

@router.get("/shared/{share_token}")
def download_shared_file(
    share_token: str,
    db: Session = Depends(get_db)
):
    """
    Publicly accessible endpoint to download a file if you have the share token.
    """
    file = db.query(File).filter(File.share_token == share_token).first()
    if not file:
        raise HTTPException(status_code=404, detail="Invalid share link or file no longer available")
        
    filepath = os.path.join(UPLOAD_DIR, file.stored_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File data missing on disk")
        
    headers = {
        'Content-Disposition': f'attachment; filename="{file.original_filename}"',
        'Content-Length': str(file.size_bytes)
    }
    return StreamingResponse(decrypt_stream(filepath), media_type=file.mime_type, headers=headers)
