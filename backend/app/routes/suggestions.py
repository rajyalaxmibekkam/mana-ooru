
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.suggestion import Suggestion
from app.security import get_current_admin


router = APIRouter(
    prefix="/api/suggestions",
    tags=["Suggestions"]
)


# --------------------------------
# REQUEST MODELS
# --------------------------------

class SuggestionCreate(BaseModel):

    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5, max_length=3000)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Category must contain at least 2 characters.")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        value = value.strip()

        if len(value) < 5:
            raise ValueError("Description must contain at least 5 characters.")

        return value


# --------------------------------
# ALLOWED SUGGESTION STATUSES
# --------------------------------

SuggestionStatus = Literal[
    "Pending",
    "Under Review",
    "Accepted",
    "Implemented",
    "Rejected"
]


class SuggestionStatusUpdate(BaseModel):
    status: SuggestionStatus


# --------------------------------
# RESPONSE MODEL
# --------------------------------

class SuggestionResponse(BaseModel):

    id: int
    category: str
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --------------------------------
# PUBLIC: SUBMIT SUGGESTION
# --------------------------------

@router.post(
    "/",
    response_model=SuggestionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_suggestion(
    data: SuggestionCreate,
    db: Session = Depends(get_db)
):

    suggestion = Suggestion(
        category=data.category,
        description=data.description,
        status="Pending"
    )

    try:
        db.add(suggestion)
        db.commit()
        db.refresh(suggestion)

        return suggestion

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to submit suggestion."
        )


# --------------------------------
# PUBLIC: TRACK SUGGESTION STATUS
# --------------------------------

@router.get("/track/{suggestion_id}")
def track_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db)
):

    try:
        suggestion = (
            db.query(Suggestion)
            .filter(Suggestion.id == suggestion_id)
            .first()
        )

        if not suggestion:
            raise HTTPException(
                status_code=404,
                detail="Suggestion not found."
            )

        return {
            "id": suggestion.id,
            "category": suggestion.category,
            "status": suggestion.status,
            "created_at": suggestion.created_at
        }

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve suggestion status."
        )


# --------------------------------
# PRESIDENT: VIEW ALL SUGGESTIONS
# --------------------------------

@router.get(
    "/admin",
    response_model=list[SuggestionResponse]
)
def get_all_suggestions(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    try:
        return (
            db.query(Suggestion)
            .order_by(Suggestion.created_at.desc())
            .all()
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve suggestions."
        )


# --------------------------------
# PRESIDENT: UPDATE SUGGESTION STATUS
# --------------------------------

@router.patch("/admin/{suggestion_id}/status")
def update_suggestion_status(
    suggestion_id: int,
    data: SuggestionStatusUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    suggestion = (
        db.query(Suggestion)
        .filter(Suggestion.id == suggestion_id)
        .first()
    )

    if not suggestion:
        raise HTTPException(
            status_code=404,
            detail="Suggestion not found."
        )

    try:
        suggestion.status = data.status

        db.commit()
        db.refresh(suggestion)

        return {
            "message": "Suggestion status updated successfully.",
            "suggestion": suggestion
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to update suggestion status."
        )


# --------------------------------
# PRESIDENT: DELETE SUGGESTION
# --------------------------------

@router.delete("/admin/{suggestion_id}")
def delete_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    suggestion = (
        db.query(Suggestion)
        .filter(Suggestion.id == suggestion_id)
        .first()
    )

    if not suggestion:
        raise HTTPException(
            status_code=404,
            detail="Suggestion not found."
        )

    try:
        db.delete(suggestion)
        db.commit()

        return {
            "message": "Suggestion deleted successfully."
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete suggestion."
        )
