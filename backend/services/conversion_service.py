import os
import uuid
import ffmpeg
from sqlalchemy.orm import Session
from models.file import File, ConversionStatus
from services.encryption_service import decrypt_file, encrypt_file
from db.session import SessionLocal

UPLOAD_DIR = os.path.join(os.getcwd(), "storage")
FFMPEG_BIN_DIR = os.path.join(os.getcwd(), "ffmpeg_bin")

# Prepend ffmpeg_bin to PATH so ffmpeg-python can find it
if os.path.exists(FFMPEG_BIN_DIR):
    os.environ["PATH"] = FFMPEG_BIN_DIR + os.pathsep + os.environ.get("PATH", "")

def process_conversion(file_id: int, target_format: str):
    """
    Background task to securely convert a file to a target format.
    """
    db = SessionLocal()
    try:
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            return

        # Update status to processing
        file.conversion_status = ConversionStatus.PROCESSING
        db.commit()

        stored_filepath = os.path.join(UPLOAD_DIR, file.stored_filename)
        
        # 1. Decrypt into a temporary file
        temp_input_filename = f"temp_in_{uuid.uuid4()}.{file.original_filename.split('.')[-1]}"
        temp_input_filepath = os.path.join(UPLOAD_DIR, temp_input_filename)
        decrypt_file(stored_filepath, temp_input_filepath)
        
        # 2. Convert using FFmpeg
        temp_output_filename = f"temp_out_{uuid.uuid4()}.{target_format}"
        temp_output_filepath = os.path.join(UPLOAD_DIR, temp_output_filename)
        
        # Validation: Only allow MP4 -> MP3 for now
        ext = file.original_filename.split('.')[-1].lower()
        if ext != 'mp4' or target_format != 'mp3':
            raise Exception(f"Unsupported conversion: {ext} to {target_format}. Only MP4 to MP3 is allowed.")

        # ffmpeg throws an exception if it fails (e.g. unknown format)
        # We select only the audio stream and force the mp3 codec for a robust conversion
        input_stream = ffmpeg.input(temp_input_filepath)
        audio_stream = input_stream.audio
        stream = ffmpeg.output(audio_stream, temp_output_filepath, acodec='libmp3lame', audio_bitrate='192k')
        ffmpeg.run(stream, overwrite_output=True, quiet=True)
        
        # 3. Encrypt the newly converted file
        new_stored_filename = f"{uuid.uuid4()}.enc"
        new_stored_filepath = os.path.join(UPLOAD_DIR, new_stored_filename)
        encrypt_file(temp_output_filepath, new_stored_filepath)
        
        # 4. Measure the UNENCRYPTED size BEFORE cleaning up temporary files
        # This ensures the Content-Length matches the decrypted stream length during download
        new_size = os.path.getsize(temp_output_filepath)
        
        # 5. Clean up temporary files AND the old encrypted file
        os.remove(temp_input_filepath)
        os.remove(temp_output_filepath)
        os.remove(stored_filepath)
        
        # 6. Update DB record to point to new file

        # Note: In a real app we'd determine the mime_type dynamically,
        # here we'll do a simple fallback based on the extension
        file.original_filename = f"{file.original_filename.rsplit('.', 1)[0]}.{target_format}"
        file.stored_filename = new_stored_filename
        file.size_bytes = new_size # Size changed
        file.conversion_status = ConversionStatus.COMPLETED
        db.commit()
            
    except ffmpeg.Error as e:
        print(f"FFmpeg conversion failed: {e.stderr.decode() if e.stderr else str(e)}")
        file.conversion_status = ConversionStatus.FAILED
        db.commit()
    except Exception as e:
        print(f"Conversion failed: {e}")
        file.conversion_status = ConversionStatus.FAILED
        db.commit()
    finally:
        db.close()
        # Failsafe cleanup for temp files in case of crash
        if 'temp_input_filepath' in locals() and os.path.exists(temp_input_filepath):
            os.remove(temp_input_filepath)
        if 'temp_output_filepath' in locals() and os.path.exists(temp_output_filepath):
            os.remove(temp_output_filepath)
