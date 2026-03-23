import os
import uuid
import ffmpeg
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

router = APIRouter()
UPLOAD_DIR = os.path.join(os.getcwd(), "storage")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def cleanup_files(file1: str, file2: str):
    """
    Background task to clean up temporary files after they are streamed to the client.
    """
    try:
        if os.path.exists(file1):
            os.remove(file1)
        if os.path.exists(file2):
            os.remove(file2)
    except Exception as e:
        print(f"Error during cleanup: {e}")

@router.post("/convert")
async def public_convert_mp4_to_mp3(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Public endpoint to convert MP4 to MP3 on the fly without database storage.
    Files are saved temporarily and deleted immediately after serving.
    """
    # 1. Validation
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    
    ext = file.filename.split('.')[-1].lower()
    if ext != 'mp4':
        raise HTTPException(status_code=400, detail="Only MP4 files are supported for public conversion.")
    
    # 2. Save uploaded file temporarily
    temp_id = str(uuid.uuid4())
    temp_input_filename = f"public_in_{temp_id}.mp4"
    temp_input_filepath = os.path.join(UPLOAD_DIR, temp_input_filename)
    
    try:
        with open(temp_input_filepath, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)
                
        # 3. Convert using FFmpeg
        temp_output_filename = f"public_out_{temp_id}.mp3"
        temp_output_filepath = os.path.join(UPLOAD_DIR, temp_output_filename)
        
        input_stream = ffmpeg.input(temp_input_filepath)
        audio_stream = input_stream.audio
        stream = ffmpeg.output(audio_stream, temp_output_filepath, acodec='libmp3lame', audio_bitrate='192k')
        ffmpeg.run(stream, overwrite_output=True, quiet=True)
        
        # 4. Return the converted file and schedule cleanup
        original_name_base = file.filename.rsplit('.', 1)[0]
        download_name = f"{original_name_base}.mp3"
        
        background_tasks.add_task(cleanup_files, temp_input_filepath, temp_output_filepath)
        
        return FileResponse(
            path=temp_output_filepath, 
            media_type='audio/mpeg', 
            filename=download_name
        )
        
    except ffmpeg.Error as e:
        # Cleanup on failure
        if os.path.exists(temp_input_filepath):
            os.remove(temp_input_filepath)
        error_message = e.stderr.decode() if e.stderr else str(e)
        print(f"Public FFmpeg conversion failed: {error_message}")
        raise HTTPException(status_code=500, detail="Error during file conversion.")
    except Exception as e:
        # Cleanup on failure
        if os.path.exists(temp_input_filepath):
            os.remove(temp_input_filepath)
        print(f"Public conversion failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during conversion.")
