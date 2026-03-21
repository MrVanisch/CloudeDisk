from fastapi import APIRouter
from api.routes import auth, files, plans, admin, tickets

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
