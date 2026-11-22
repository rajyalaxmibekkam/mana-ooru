
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    tracking_id = Column(
        String(30),
        unique=True,
        index=True,
        nullable=False
    )

    category = Column(String(100), nullable=False)

    description = Column(Text, nullable=False)

    location = Column(String(255), nullable=True)

    status = Column(
        String(30),
        default="Submitted",
        nullable=False
    )

    photo_path = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationship with complaint status history
    status_history = relationship(
        "ComplaintStatusHistory",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintStatusHistory.changed_at"
    )
