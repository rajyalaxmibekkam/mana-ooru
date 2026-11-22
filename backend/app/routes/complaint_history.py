
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintStatusHistory


router = APIRouter(
    prefix="/api/public",
    tags=["Public Complaint History"]
)


@router.get("/track/{tracking_id}/history")
def get_complaint_history(
    tracking_id: str,
    db: Session = Depends(get_db)
):
    """
    Public complaint status history.

    Returns chronological status updates without exposing
    complaint descriptions, locations, or photos.
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
        # Find complaint
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

        # Retrieve status history chronologically
        history = (
            db.query(ComplaintStatusHistory)
            .filter(
                ComplaintStatusHistory.complaint_id == complaint.id
            )
            .order_by(
                ComplaintStatusHistory.changed_at.asc(),
                ComplaintStatusHistory.id.asc()
            )
            .all()
        )

        return {
            "tracking_id": complaint.tracking_id,
            "current_status": complaint.status,
            "history": [
                {
                    "old_status": item.old_status,
                    "new_status": item.new_status,
                    "changed_at": item.changed_at
                }
                for item in history
            ]
        }

    except SQLAlchemyError:
        db.rollback()
        
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint history. Please try again."
        )
