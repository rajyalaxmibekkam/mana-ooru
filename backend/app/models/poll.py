
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)

    question = Column(String(300), nullable=False)

    description = Column(Text, nullable=True)

    is_published = Column(Boolean, default=False, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )

    options = relationship(
        "PollOption",
        back_populates="poll",
        cascade="all, delete-orphan"
    )

    votes = relationship(
        "PollVote",
        back_populates="poll",
        cascade="all, delete-orphan"
    )


class PollOption(Base):
    __tablename__ = "poll_options"

    id = Column(Integer, primary_key=True, index=True)

    poll_id = Column(
        Integer,
        ForeignKey("polls.id", ondelete="CASCADE"),
        nullable=False
    )

    option_text = Column(String(200), nullable=False)

    poll = relationship(
        "Poll",
        back_populates="options"
    )

    votes = relationship(
        "PollVote",
        back_populates="option"
    )


class PollVote(Base):
    __tablename__ = "poll_votes"

    __table_args__ = (
        UniqueConstraint(
            "poll_id",
            "voter_key",
            name="uq_poll_voter"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    poll_id = Column(
        Integer,
        ForeignKey("polls.id", ondelete="CASCADE"),
        nullable=False
    )

    option_id = Column(
        Integer,
        ForeignKey("poll_options.id", ondelete="CASCADE"),
        nullable=False
    )

    # A browser-generated random identifier, not a person's name or phone.
    voter_key = Column(String(64), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    poll = relationship(
        "Poll",
        back_populates="votes"
    )

    option = relationship(
        "PollOption",
        back_populates="votes"
    )
