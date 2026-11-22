
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.security import get_current_admin
from app.models.complaint import Complaint
from app.models.poll import Poll, PollVote


router = APIRouter(
    prefix="/api/reports",
    tags=["President Reports"]
)


def shift_month(year: int, month: int, offset: int):
    """Move forward or backward by calendar months."""
    month_index = year * 12 + (month - 1) + offset
    new_year, zero_based_month = divmod(month_index, 12)

    return new_year, zero_based_month + 1


@router.get("/")
def get_reports(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    try:
        now = datetime.now(timezone.utc)

        # --------------------------------
        # COMPLAINT STATISTICS
        # --------------------------------

        total_complaints = (
            db.query(func.count(Complaint.id)).scalar() or 0
        )

        pending_complaints = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.status.in_(
                    ["Submitted", "Under Review"]
                )
            )
            .scalar() or 0
        )

        in_progress_complaints = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.status == "In Progress"
            )
            .scalar() or 0
        )

        resolved_complaints = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.status == "Resolved"
            )
            .scalar() or 0
        )

        rejected_complaints = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.status == "Rejected"
            )
            .scalar() or 0
        )

        classified_complaints = (
            pending_complaints
            + in_progress_complaints
            + resolved_complaints
            + rejected_complaints
        )

        other_complaints = max(
            0,
            total_complaints - classified_complaints
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
            .order_by(
                func.count(Complaint.id).desc()
            )
            .all()
        )

        category_statistics = [
            {
                "category": row.category,
                "count": row.count
            }
            for row in category_rows
        ]

        # --------------------------------
        # MONTHLY STATISTICS - LAST 6 MONTHS
        # --------------------------------

        month_labels = []

        for offset in range(5, -1, -1):
            year, month = shift_month(
                now.year,
                now.month,
                -offset
            )

            month_labels.append((year, month))

        monthly_counts = {
            f"{year:04d}-{month:02d}": 0
            for year, month in month_labels
        }

        # Retrieve dates and group them in Python.
        # This avoids database-specific date functions.
        complaint_dates = (
            db.query(Complaint.created_at)
            .filter(Complaint.created_at.isnot(None))
            .all()
        )

        for row in complaint_dates:
            created_at = row.created_at

            # SQLite may return naive datetime values.
            # Treat those values as UTC.
            if created_at.tzinfo is None:
                created_at = created_at.replace(
                    tzinfo=timezone.utc
                )

            month_key = created_at.strftime("%Y-%m")

            if month_key in monthly_counts:
                monthly_counts[month_key] += 1

        monthly_statistics = [
            {
                "month": f"{year:04d}-{month:02d}",
                "count": monthly_counts[
                    f"{year:04d}-{month:02d}"
                ]
            }
            for year, month in month_labels
        ]

        # --------------------------------
        # POLL STATISTICS
        # --------------------------------

        total_polls = (
            db.query(func.count(Poll.id)).scalar() or 0
        )

        published_polls = (
            db.query(func.count(Poll.id))
            .filter(Poll.is_published.is_(True))
            .scalar() or 0
        )

        active_polls = (
            db.query(func.count(Poll.id))
            .filter(
                Poll.is_published.is_(True),
                Poll.is_active.is_(True)
            )
            .scalar() or 0
        )

        total_poll_votes = (
            db.query(func.count(PollVote.id)).scalar() or 0
        )

        # --------------------------------
        # FINAL REPORT RESPONSE
        # --------------------------------

        return {
            "generated_at": now.isoformat(),

            "complaints": {
                "total": total_complaints,
                "pending": pending_complaints,
                "in_progress": in_progress_complaints,
                "resolved": resolved_complaints,
                "rejected": rejected_complaints,
                "other": other_complaints
            },

            "category_statistics": category_statistics,

            "monthly_statistics": monthly_statistics,

            "polls": {
                "total": total_polls,
                "published": published_polls,
                "active": active_polls,
                "total_votes": total_poll_votes
            }
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate reports. "
                "Please try again."
            )
        )
