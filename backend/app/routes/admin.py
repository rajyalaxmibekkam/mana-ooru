
from datetime import datetime
from pathlib import Path
from typing import Literal
import mimetypes

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.admin import Admin
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintStatusHistory
from app.security import (
    verify_password,
    create_access_token,
    get_current_admin
)


router = APIRouter(
    prefix="/api/admin",
    tags=["President Dashboard"]
)


# --------------------------------
# PRIVATE PHOTO STORAGE DIRECTORY
# --------------------------------

# backend/app/routes/admin.py -> backend/uploads
UPLOADS_DIR = (
    Path(__file__).resolve().parents[2] / "uploads"
).resolve()


# --------------------------------
# REQUEST AND RESPONSE SCHEMAS
# --------------------------------

AllowedStatus = Literal[
    "Submitted",
    "Under Review",
    "In Progress",
    "Resolved",
    "Rejected"
]


class AdminLogin(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Username cannot be empty.")

        return value


class StatusUpdate(BaseModel):
    status: AllowedStatus


class ComplaintResponse(BaseModel):
    tracking_id: str
    category: str
    description: str
    location: str | None
    status: str
    created_at: datetime
    has_photo: bool = False


# --------------------------------
# HELPER FUNCTIONS
# --------------------------------

def find_complaint(db: Session, tracking_id: str):
    clean_tracking_id = tracking_id.strip().upper()

    if not clean_tracking_id or len(clean_tracking_id) > 30:
        raise HTTPException(
            status_code=400,
            detail="Invalid tracking ID."
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.tracking_id == clean_tracking_id
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found."
        )

    return complaint


def build_complaint_response(complaint: Complaint):
    """Return complaint details without exposing the stored photo path."""

    return {
        "tracking_id": complaint.tracking_id,
        "category": complaint.category,
        "description": complaint.description,
        "location": complaint.location,
        "status": complaint.status,
        "created_at": complaint.created_at,
        "has_photo": bool(complaint.photo_path)
    }


def get_private_photo_file(photo_path: str) -> Path:
    """
    Resolve an uploaded photo safely inside backend/uploads.
    Reject paths outside the configured upload directory.
    """

    prefix = "/uploads/"

    if not photo_path or not photo_path.startswith(prefix):
        raise HTTPException(
            status_code=404,
            detail="Complaint photo not found."
        )

    relative_path = photo_path[len(prefix):]

    if not relative_path:
        raise HTTPException(
            status_code=404,
            detail="Complaint photo not found."
        )

    try:
        photo_file = (UPLOADS_DIR / relative_path).resolve()

        if not photo_file.is_relative_to(UPLOADS_DIR):
            raise HTTPException(
                status_code=404,
                detail="Complaint photo not found."
            )

    except (OSError, ValueError):
        raise HTTPException(
            status_code=404,
            detail="Complaint photo not found."
        )

    if not photo_file.is_file():
        raise HTTPException(
            status_code=404,
            detail="Complaint photo not found."
        )

    return photo_file


# --------------------------------
# PRESIDENT LOGIN
# --------------------------------

@router.post("/login")
def admin_login(
    login_data: AdminLogin,
    db: Session = Depends(get_db)
):
    try:
        admin = (
            db.query(Admin)
            .filter(
                Admin.username == login_data.username
            )
            .first()
        )

        if (
            not admin
            or not admin.is_active
            or not verify_password(
                login_data.password,
                admin.password_hash
            )
        ):
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password."
            )

        token = create_access_token(admin.username)

        return {
            "access_token": token,
            "token_type": "bearer",
            "username": admin.username
        }

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to process login. Please try again."
        )


# --------------------------------
# PRESIDENT PROFILE
# --------------------------------

@router.get("/me")
def admin_profile(
    current_admin: Admin = Depends(get_current_admin)
):
    return {
        "id": current_admin.id,
        "username": current_admin.username,
        "is_active": current_admin.is_active
    }


# --------------------------------
# VIEW ALL COMPLAINTS
# --------------------------------

@router.get(
    "/complaints",
    response_model=list[ComplaintResponse]
)
def get_all_complaints(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    try:
        complaints = (
            db.query(Complaint)
            .order_by(Complaint.created_at.desc())
            .all()
        )

        return [
            build_complaint_response(complaint)
            for complaint in complaints
        ]

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaints."
        )


# --------------------------------
# VIEW ONE COMPLAINT
# --------------------------------

@router.get(
    "/complaints/{tracking_id}",
    response_model=ComplaintResponse
)
def get_complaint_details(
    tracking_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    try:
        complaint = find_complaint(db, tracking_id)

        return build_complaint_response(complaint)

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint details."
        )


# --------------------------------
# VIEW COMPLAINT PHOTO
# PRESIDENT AUTHENTICATION REQUIRED
# --------------------------------

@router.get("/complaints/{tracking_id}/photo")
def get_complaint_photo(
    tracking_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    try:
        complaint = find_complaint(db, tracking_id)

        if not complaint.photo_path:
            raise HTTPException(
                status_code=404,
                detail="No photo is attached to this complaint."
            )

        photo_file = get_private_photo_file(
            complaint.photo_path
        )

        media_type, _ = mimetypes.guess_type(
            photo_file.name
        )

        if media_type not in (
            "image/jpeg",
            "image/png",
            "image/webp"
        ):
            raise HTTPException(
                status_code=415,
                detail="Unsupported photo format."
            )

        return FileResponse(
            path=photo_file,
            media_type=media_type,
            filename=photo_file.name,
            headers={
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff"
            }
        )

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint photo."
        )


# --------------------------------
# UPDATE COMPLAINT STATUS
# AND RECORD STATUS HISTORY
# --------------------------------

@router.patch("/complaints/{tracking_id}/status")
def update_complaint_status(
    tracking_id: str,
    status_data: StatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    try:
        complaint = find_complaint(db, tracking_id)

        old_status = complaint.status
        new_status = status_data.status

        # Avoid duplicate history entries.
        if old_status == new_status:
            return {
                "message": "Complaint already has this status.",
                "tracking_id": complaint.tracking_id,
                "status": complaint.status
            }

        # Update current complaint status.
        complaint.status = new_status

        # Create status history record.
        history_entry = ComplaintStatusHistory(
            complaint_id=complaint.id,
            old_status=old_status,
            new_status=new_status
        )

        db.add(history_entry)

        # Save both changes in one transaction.
        db.commit()
        db.refresh(complaint)

        return {
            "message": (
                "Complaint status updated and history "
                "recorded successfully."
            ),
            "tracking_id": complaint.tracking_id,
            "old_status": old_status,
            "new_status": complaint.status
        }

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update complaint status."
        )
