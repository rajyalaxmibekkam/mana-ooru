
from datetime import datetime, timedelta, timezone
from pathlib import Path
from secrets import token_hex, token_urlsafe
from hashlib import sha256

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Header
)
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.database import get_db
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintStatusHistory
from app.models.photo_upload_authorization import (
    ComplaintPhotoUploadAuthorization
)


router = APIRouter(
    prefix="/api/complaints",
    tags=["Complaints"]
)


# --------------------------------
# UPLOAD CONFIGURATION
# --------------------------------

MAX_FILE_SIZE = 5 * 1024 * 1024
PHOTO_TOKEN_EXPIRY_MINUTES = 30

BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads" / "complaints"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGES = {
    ".jpg": ("image/jpeg",),
    ".jpeg": ("image/jpeg",),
    ".png": ("image/png",),
    ".webp": ("image/webp",)
}


# --------------------------------
# TOKEN HELPERS
# --------------------------------

def hash_upload_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def is_token_expired(expires_at: datetime) -> bool:
    # SQLite may return a naive datetime even when timezone=True.
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return expires_at <= datetime.now(timezone.utc)


# --------------------------------
# IMAGE VALIDATION
# --------------------------------

def validate_image(file_bytes: bytes, extension: str) -> bool:

    if extension in (".jpg", ".jpeg"):
        return file_bytes.startswith(b"\xff\xd8\xff")

    if extension == ".png":
        return file_bytes.startswith(b"\x89PNG\r\n\x1a\n")

    if extension == ".webp":
        return (
            len(file_bytes) >= 12
            and file_bytes.startswith(b"RIFF")
            and file_bytes[8:12] == b"WEBP"
        )

    return False


# --------------------------------
# COMPLAINT REQUEST SCHEMA
# --------------------------------

class ComplaintCreate(BaseModel):

    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5, max_length=5000)
    location: str | None = Field(default=None, max_length=255)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Please select a valid complaint category.")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        value = value.strip()

        if len(value) < 5:
            raise ValueError("Description must contain at least 5 characters.")

        return value

    @field_validator("location")
    @classmethod
    def validate_location(cls, value):
        if value is not None:
            value = value.strip() or None

        return value


# --------------------------------
# RESPONSE SCHEMAS
# --------------------------------

class ComplaintResponse(BaseModel):

    tracking_id: str
    category: str
    description: str
    location: str | None
    status: str
    photo_path: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintSubmissionResponse(ComplaintResponse):
    photo_upload_token: str


class PhotoUploadResponse(BaseModel):
    tracking_id: str
    status: str
    photo_uploaded: bool


class PublicComplaintResponse(BaseModel):

    tracking_id: str
    category: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --------------------------------
# TRACKING ID GENERATION
# --------------------------------

def generate_tracking_id(db: Session) -> str:

    while True:

        tracking_id = (
            f"KOTHIDARA-{datetime.now().year}-"
            f"{token_hex(3).upper()}"
        )

        existing = (
            db.query(Complaint)
            .filter(Complaint.tracking_id == tracking_id)
            .first()
        )

        if not existing:
            return tracking_id


# --------------------------------
# SUBMIT COMPLAINT
# --------------------------------

@router.post(
    "/",
    response_model=ComplaintSubmissionResponse,
    status_code=201
)
def submit_complaint(
    complaint_data: ComplaintCreate,
    db: Session = Depends(get_db)
):

    new_complaint = Complaint(
        tracking_id=generate_tracking_id(db),
        category=complaint_data.category,
        description=complaint_data.description,
        location=complaint_data.location
    )

    # Generate a random token. Only its hash is stored in the database.
    raw_upload_token = token_urlsafe(32)

    authorization = None

    try:

        db.add(new_complaint)
        db.flush()

        initial_history = ComplaintStatusHistory(
            complaint_id=new_complaint.id,
            old_status=None,
            new_status=new_complaint.status
        )

        authorization = ComplaintPhotoUploadAuthorization(
            complaint_id=new_complaint.id,
            token_hash=hash_upload_token(raw_upload_token),
            expires_at=(
                datetime.now(timezone.utc)
                + timedelta(minutes=PHOTO_TOKEN_EXPIRY_MINUTES)
            ),
            consumed_at=None
        )

        db.add(initial_history)
        db.add(authorization)

        # Complaint, history and upload authorization are saved together.
        db.commit()
        db.refresh(new_complaint)

        response = ComplaintSubmissionResponse.model_validate(
            new_complaint
        )

        response.photo_upload_token = raw_upload_token

        return response

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Unable to generate a unique tracking ID. Please submit again."
        )

    except SQLAlchemyError:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to submit the complaint. Please try again."
        )


# --------------------------------
# UPLOAD COMPLAINT PHOTOGRAPH
# --------------------------------

@router.post(
    "/{tracking_id}/photo",
    response_model=PhotoUploadResponse
)
async def upload_complaint_photo(
    tracking_id: str,
    file: UploadFile = File(...),
    photo_upload_token: str | None = Header(
        default=None,
        alias="X-Photo-Upload-Token"
    ),
    db: Session = Depends(get_db)
):

    clean_tracking_id = tracking_id.strip().upper()

    if not clean_tracking_id or len(clean_tracking_id) > 30:
        raise HTTPException(
            status_code=400,
            detail="Invalid tracking ID."
        )

    if not photo_upload_token:
        raise HTTPException(
            status_code=401,
            detail="Photo upload authorization is required."
        )

    destination = None

    try:

        complaint = (
            db.query(Complaint)
            .filter(Complaint.tracking_id == clean_tracking_id)
            .first()
        )

        if not complaint:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found."
            )

        authorization = (
            db.query(ComplaintPhotoUploadAuthorization)
            .filter(
                ComplaintPhotoUploadAuthorization.complaint_id
                == complaint.id
            )
            .with_for_update()
            .first()
        )

        if not authorization:
            raise HTTPException(
                status_code=401,
                detail="Photo upload authorization was not found."
            )

        supplied_hash = hash_upload_token(photo_upload_token)

        if supplied_hash != authorization.token_hash:
            raise HTTPException(
                status_code=401,
                detail="Invalid photo upload authorization."
            )

        if authorization.consumed_at is not None:
            raise HTTPException(
                status_code=409,
                detail="This photo upload authorization has already been used."
            )

        if is_token_expired(authorization.expires_at):
            raise HTTPException(
                status_code=401,
                detail="Photo upload authorization has expired."
            )

        extension = Path(file.filename or "").suffix.lower()

        if extension not in ALLOWED_IMAGES:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, JPEG, PNG and WebP images are allowed."
            )

        if file.content_type not in ALLOWED_IMAGES[extension]:
            raise HTTPException(
                status_code=400,
                detail="Invalid image content type."
            )

        file_bytes = await file.read(MAX_FILE_SIZE + 1)

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty."
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image size must not exceed 5 MB."
            )

        if not validate_image(file_bytes, extension):
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid image."
            )

        unique_filename = f"{token_hex(16)}{extension}"
        destination = UPLOAD_DIR / unique_filename

        destination.write_bytes(file_bytes)

        old_photo_path = complaint.photo_path

        complaint.photo_path = (
            f"/uploads/complaints/{unique_filename}"
        )

        authorization.consumed_at = datetime.now(timezone.utc)

        # Save the photo reference and consume the token together.
        db.commit()

        if old_photo_path:

            old_filename = Path(old_photo_path).name
            old_file = UPLOAD_DIR / old_filename

            if old_file.parent == UPLOAD_DIR and old_file.exists():
                try:
                    old_file.unlink()
                except OSError:
                    pass

        return PhotoUploadResponse(
            tracking_id=complaint.tracking_id,
            status=complaint.status,
            photo_uploaded=True
        )

    except HTTPException:
        raise

    except (SQLAlchemyError, OSError):

        db.rollback()

        if destination is not None and destination.exists():
            try:
                destination.unlink()
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail="Unable to save the uploaded photograph."
        )

    finally:
        await file.close()


# --------------------------------
# PUBLIC COMPLAINT TRACKING
# --------------------------------

@router.get(
    "/{tracking_id}",
    response_model=PublicComplaintResponse
)
def track_complaint(
    tracking_id: str,
    db: Session = Depends(get_db)
):

    clean_tracking_id = tracking_id.strip().upper()

    if not clean_tracking_id or len(clean_tracking_id) > 30:
        raise HTTPException(
            status_code=400,
            detail="Invalid tracking ID."
        )

    try:

        complaint = (
            db.query(Complaint)
            .filter(Complaint.tracking_id == clean_tracking_id)
            .first()
        )

        if not complaint:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found. Please check your tracking ID."
            )

        return complaint

    except SQLAlchemyError:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint details."
        )
