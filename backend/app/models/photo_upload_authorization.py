from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from app.database import Base


class ComplaintPhotoUploadAuthorization(Base):
    __tablename__ = "complaint_photo_upload_authorizations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    token_hash = Column(
        String(64),
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    consumed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )
