import os
from cryptography.fernet import Fernet
from core.config import settings

fernet = Fernet(settings.FILE_ENCRYPTION_KEY)

def encrypt_file(source_path: str, dest_path: str, chunk_size: int = 64 * 1024):
    """
    Encrypts a file chunk by chunk to avoid loading the entire file into memory.
    """
    with open(source_path, 'rb') as f_in, open(dest_path, 'wb') as f_out:
        while True:
            chunk = f_in.read(chunk_size)
            if not chunk:
                break
            # We encrypt each chunk independently. Note: For extremely large files,
            # streaming encryption (e.g. using cryptography.hazmat AES GCM) is better,
            # but Fernet chunking works for standard file sizes.
            # We store the size of the encrypted chunk first (4 bytes) so we know how much to read during decryption
            encrypted_chunk = fernet.encrypt(chunk)
            f_out.write(len(encrypted_chunk).to_bytes(4, byteorder='big'))
            f_out.write(encrypted_chunk)

def decrypt_file(source_path: str, dest_path: str):
    """
    Decrypts a file block by block.
    """
    with open(source_path, 'rb') as f_in, open(dest_path, 'wb') as f_out:
        while True:
            # Read the size of the next encrypted chunk
            size_bytes = f_in.read(4)
            if not size_bytes:
                break
            chunk_size = int.from_bytes(size_bytes, byteorder='big')
            
            encrypted_chunk = f_in.read(chunk_size)
            decrypted_chunk = fernet.decrypt(encrypted_chunk)
            f_out.write(decrypted_chunk)

def decrypt_stream(source_path: str):
    """
    Generator that yields decrypted chunks for live streaming back to the client.
    """
    with open(source_path, 'rb') as f_in:
        while True:
            size_bytes = f_in.read(4)
            if not size_bytes:
                break
            chunk_size = int.from_bytes(size_bytes, byteorder='big')
            encrypted_chunk = f_in.read(chunk_size)
            yield fernet.decrypt(encrypted_chunk)
