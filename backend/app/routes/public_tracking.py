
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.complaint import Complaint


router = APIRouter(
    prefix="/api/public",
    tags=["Public Complaint Tracking"]
)


@router.get("/track/{tracking_id}")
def track_complaint(
    tracking_id: str,
    db: Session = Depends(get_db)
):
    """
    Public complaint tracking.

    Returns only basic information required to track
    a complaint. Does not expose private complaint details.
    """

    clean_tracking_id = tracking_id.strip().upper()

    if not clean_tracking_id:
        raise HTTPException(
            status_code=400,
            detail="Tracking ID is required."
        )

    if len(clean_tracking_id) > 30:
        raise HTTPException(
            status_code=400,
            detail="Invalid tracking ID."
        )

    try:
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
                detail="No complaint found with this tracking ID."
            )

        return {
            "tracking_id": complaint.tracking_id,
            "category": complaint.category,
            "status": complaint.status,
            "created_at": complaint.created_at
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint details. Please try again."
        )
