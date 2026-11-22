
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.announcement import Announcement
from app.security import get_current_admin


router = APIRouter(
    prefix="/api/announcements",
    tags=["Announcements"]
)


# --------------------------------
# REQUEST MODELS
# --------------------------------

class AnnouncementCreate(BaseModel):

    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=5)
    category: str = Field(default="General", min_length=2, max_length=100)
    is_published: bool = True

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        value = value.strip()

        if len(value) < 3:
            raise ValueError("Title must contain at least 3 characters.")

        return value

    @field_validator("content")
    @classmethod
    def validate_content(cls, value):
        value = value.strip()

        if len(value) < 5:
            raise ValueError("Content must contain at least 5 characters.")

        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Category must contain at least 2 characters.")

        return value


class AnnouncementUpdate(BaseModel):

    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    content: Optional[str] = Field(default=None, min_length=5)
    category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    is_published: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        if value is not None:
            value = value.strip()

            if len(value) < 3:
                raise ValueError("Title must contain at least 3 characters.")

        return value

    @field_validator("content")
    @classmethod
    def validate_content(cls, value):
        if value is not None:
            value = value.strip()

            if len(value) < 5:
                raise ValueError("Content must contain at least 5 characters.")

        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        if value is not None:
            value = value.strip()

            if len(value) < 2:
                raise ValueError("Category must contain at least 2 characters.")

        return value


# --------------------------------
# RESPONSE MODEL
# --------------------------------

class AnnouncementResponse(BaseModel):

    id: int
    title: str
    content: str
    category: str
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --------------------------------
# PUBLIC: VIEW PUBLISHED ANNOUNCEMENTS
# --------------------------------

@router.get(
    "/",
    response_model=list[AnnouncementResponse]
)
def get_public_announcements(
    db: Session = Depends(get_db)
):

    try:
        return (
            db.query(Announcement)
            .filter(Announcement.is_published.is_(True))
            .order_by(Announcement.created_at.desc())
            .all()
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve announcements."
        )


# --------------------------------
# PRESIDENT: VIEW ALL ANNOUNCEMENTS
# --------------------------------

@router.get(
    "/admin",
    response_model=list[AnnouncementResponse]
)
def get_all_announcements(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    try:
        return (
            db.query(Announcement)
            .order_by(Announcement.created_at.desc())
            .all()
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve announcements."
        )


# --------------------------------
# PRESIDENT: CREATE ANNOUNCEMENT
# --------------------------------

@router.post(
    "/",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED
)
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    announcement = Announcement(
        title=data.title,
        content=data.content,
        category=data.category,
        is_published=data.is_published
    )

    try:
        db.add(announcement)
        db.commit()
        db.refresh(announcement)

        return announcement

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create announcement."
        )


# --------------------------------
# PRESIDENT: UPDATE ANNOUNCEMENT
# --------------------------------

@router.put(
    "/{announcement_id}",
    response_model=AnnouncementResponse
)
def update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    announcement = (
        db.query(Announcement)
        .filter(Announcement.id == announcement_id)
        .first()
    )

    if not announcement:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found."
        )

    updates = data.model_dump(exclude_unset=True)

    # Prevent required fields from being set to null.
    for field, value in updates.items():

        if value is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null."
            )

    try:

        for field, value in updates.items():
            setattr(announcement, field, value)

        db.commit()
        db.refresh(announcement)

        return announcement

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update announcement."
        )


# --------------------------------
# PRESIDENT: DELETE ANNOUNCEMENT
# --------------------------------

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    announcement = (
        db.query(Announcement)
        .filter(Announcement.id == announcement_id)
        .first()
    )

    if not announcement:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found."
        )

    try:

        db.delete(announcement)
        db.commit()

        return {
            "message": "Announcement deleted successfully."
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete announcement."
        )
