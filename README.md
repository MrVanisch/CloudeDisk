# CloudeDisk

Secure Cloud Drive application with encrypted file storage and reCAPTCHA protection.

## Project Structure

- `backend/`: FastAPI application with PostgreSQL and file encryption.
- `frontend/`: Next.js application for the user interface.
- `docker-compose.yml`: Docker configuration for running the entire stack.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- (Optional) Python 3.9+ and Node.js 18+ for local development without Docker.

### Environment Setup

This project uses environment variables for configuration. **Do not commit actual `.env` files to the repository.**

1.  **Backend**:
    - Copy `backend/.env.example` to `backend/.env`.
    - Fill in the required values (Database credentials, Secret keys, etc.).
2.  **Frontend**:
    - Copy `frontend/.env.local.example` to `frontend/.env.local`.
    - Set the API URL and reCAPTCHA site key.

### Running with Docker

To start the entire application (Frontend, Backend, and Database):

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

## Security Note

Sensitive data such as database passwords, JWT secret keys, and file encryption keys are strictly managed via environment variables and should never be shared or committed to the repository.
