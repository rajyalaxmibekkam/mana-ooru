
import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before importing database and security modules
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine, SessionLocal

# Import all models before creating database tables
from app.models import (
    Complaint,
    ComplaintStatusHistory,
    Admin,
    Announcement,
    Suggestion,
    Poll,
    PollOption,
    PollVote
)

# Import API routers
from app.routes.complaints import router as complaints_router
from app.routes.admin import router as admin_router
from app.routes.announcements import router as announcements_router
from app.routes.suggestions import router as suggestions_router
from app.routes.polls import router as polls_router
from app.routes.reports import router as reports_router
from app.routes.public_stats import router as public_stats_router
from app.routes.public_tracking import router as public_tracking_router
from app.routes.complaint_history import router as complaint_history_router

from app.security import hash_password


# Create database tables
Base.metadata.create_all(bind=engine)


# Create the initial president account
def create_initial_admin():
    username = os.environ.get("ADMIN_USERNAME")
    password = os.environ.get("ADMIN_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "Set ADMIN_USERNAME and ADMIN_PASSWORD before starting the server."
        )

    if len(password) < 12:
        raise RuntimeError(
            "ADMIN_PASSWORD must contain at least 12 characters."
        )

    db = SessionLocal()

    try:
        existing_admin = db.query(Admin).filter(
            Admin.username == username
        ).first()

        if not existing_admin:
            admin = Admin(
                username=username,
                password_hash=hash_password(password),
                is_active=True
            )

            db.add(admin)
            db.commit()

            print("Initial president account created successfully.")

        else:
            print("Existing president account found.")

    finally:
        db.close()


create_initial_admin()


# Create FastAPI application
app = FastAPI(
    title="Mana Ooru - Kotha Idara Village Portal",
    description="Digital grievance portal for Kotha Idara Village",
    version="1.0.0"
)


# Serve local uploaded complaint photos
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOADS_DIR)),
    name="uploads"
)


# Configure CORS
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

# Add the deployed frontend URL when configured.
frontend_url = os.getenv("FRONTEND_URL", "").strip()

if frontend_url:
    allowed_origins.extend(
        origin.strip().rstrip("/")
        for origin in frontend_url.split(",")
        if origin.strip()
    )

# Remove duplicate origins
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Register API routers
app.include_router(complaints_router)
app.include_router(admin_router)
app.include_router(announcements_router)
app.include_router(suggestions_router)
app.include_router(polls_router)
app.include_router(reports_router)
app.include_router(public_stats_router)
app.include_router(public_tracking_router)
app.include_router(complaint_history_router)


# Root endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to Mana Ooru API",
        "village": "Kotha Idara"
    }


# Health endpoint
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "application": "Mana Ooru"
    }
