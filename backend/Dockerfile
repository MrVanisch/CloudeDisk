FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for psycopg3, cryptography, and ffmpeg
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ffmpeg \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh


# Create storage directory with appropriate permissions
RUN mkdir -p /app/storage
RUN chmod 777 /app/storage

# Expose port
EXPOSE 8000

# Command to run the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
