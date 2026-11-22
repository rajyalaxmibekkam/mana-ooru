
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.complaint import Complaint

router = APIRouter(
    prefix="/api/public",
    tags=["Public Village Statistics"]
)

@router.get("/statistics")
def get_public_statistics(
    db: Session = Depends(get_db)
):
    """
    Public village statistics.

    Does not expose complaint descriptions, tracking IDs,
    locations, photos, or personal information.
    """

    try:
        # --------------------------------
        # TOTAL COMPLAINTS
        # --------------------------------

        total_complaints = (
            db.query(func.count(Complaint.id)).scalar() or 0
        )

        # --------------------------------
        # STATUS-WISE STATISTICS
        # --------------------------------

        status_rows = (
            db.query(
                Complaint.status,
                func.count(Complaint.id)
            )
            .group_by(Complaint.status)
            .all()
        )

        status_counts = {
            status: count
            for status, count in status_rows
        }

        submitted = status_counts.get("Submitted", 0)
        under_review = status_counts.get("Under Review", 0)
        in_progress = status_counts.get("In Progress", 0)
        resolved = status_counts.get("Resolved", 0)
        rejected = status_counts.get("Rejected", 0)

        classified_total = (
            submitted
            + under_review
            + in_progress
            + resolved
            + rejected
        )

        other = max(
            0,
            total_complaints - classified_total
        )

        # --------------------------------
        # CATEGORY-WISE STATISTICS
        # --------------------------------

        category_rows = (
            db.query(
                Complaint.category.label("category"),
                func.count(Complaint.id).label("count")
            )
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
            .all()
        )

        category_statistics = [
            {
                "category": category or "Other",
                "count": count
            }
            for category, count in category_rows
        ]

        # --------------------------------
        # PUBLIC RESPONSE
        # --------------------------------

        return {
            "village": "Kotha Idara",

            "total_complaints": total_complaints,

            "status_statistics": {
                "submitted": submitted,
                "under_review": under_review,
                "in_progress": in_progress,
                "resolved": resolved,
                "rejected": rejected,
                "other": other
            },

            "category_statistics": category_statistics
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to load village statistics. Please try again."
        )