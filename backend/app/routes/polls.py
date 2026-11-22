
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.database import get_db
from app.models.poll import Poll, PollOption, PollVote
from app.security import get_current_admin


router = APIRouter(
    prefix="/api/polls",
    tags=["Village Polls"]
)


# --------------------------------
# REQUEST MODELS
# --------------------------------

class PollCreate(BaseModel):
    question: str = Field(min_length=5, max_length=300)
    description: Optional[str] = Field(default=None, max_length=3000)
    options: list[str] = Field(min_length=2, max_length=10)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value):
        value = value.strip()

        if len(value) < 5:
            raise ValueError("Question must contain at least 5 characters.")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is not None:
            value = value.strip()

            if not value:
                return None

        return value


class PollUpdate(BaseModel):
    question: Optional[str] = Field(default=None, min_length=5, max_length=300)
    description: Optional[str] = Field(default=None, max_length=3000)
    options: Optional[list[str]] = Field(default=None, min_length=2, max_length=10)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value):
        if value is not None:
            value = value.strip()

            if len(value) < 5:
                raise ValueError("Question must contain at least 5 characters.")

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is not None:
            value = value.strip()

        return value


class VoteRequest(BaseModel):
    option_id: int
    voter_key: str = Field(min_length=20, max_length=64)

    @field_validator("voter_key")
    @classmethod
    def validate_voter_key(cls, value):
        value = value.strip()

        if len(value) < 20:
            raise ValueError("Invalid voter identifier.")

        return value


# --------------------------------
# HELPER FUNCTIONS
# --------------------------------

def clean_options(options):
    if options is None:
        raise HTTPException(
            status_code=400,
            detail="Poll options cannot be empty."
        )

    cleaned = [option.strip() for option in options]

    if len(cleaned) < 2 or len(cleaned) > 10:
        raise HTTPException(
            status_code=400,
            detail="A poll must have between 2 and 10 options."
        )

    if any(not option for option in cleaned):
        raise HTTPException(
            status_code=400,
            detail="Poll options cannot be empty."
        )

    if any(len(option) > 200 for option in cleaned):
        raise HTTPException(
            status_code=400,
            detail="Each option must be 200 characters or fewer."
        )

    normalized = [option.casefold() for option in cleaned]

    if len(normalized) != len(set(normalized)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate poll options are not allowed."
        )

    return cleaned


def serialize_poll(poll, db, include_results=False):

    options_data = []

    for option in poll.options:

        vote_count = (
            db.query(func.count(PollVote.id))
            .filter(
                PollVote.poll_id == poll.id,
                PollVote.option_id == option.id
            )
            .scalar()
        )

        options_data.append({
            "id": option.id,
            "option_text": option.option_text,
            "votes": vote_count if include_results else None
        })

    total_votes = (
        db.query(func.count(PollVote.id))
        .filter(PollVote.poll_id == poll.id)
        .scalar()
    )

    return {
        "id": poll.id,
        "question": poll.question,
        "description": poll.description,
        "is_published": poll.is_published,
        "is_active": poll.is_active,
        "created_at": poll.created_at,
        "updated_at": poll.updated_at,
        "total_votes": total_votes if include_results else None,
        "options": options_data
    }


def commit_changes(db):

    try:
        db.commit()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Database operation failed. Please try again."
        )


# --------------------------------
# PRESIDENT: VIEW ALL POLLS
# --------------------------------

@router.get("/admin")
def get_admin_polls(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    try:
        polls = (
            db.query(Poll)
            .order_by(Poll.created_at.desc())
            .all()
        )

        return [
            serialize_poll(poll, db, include_results=True)
            for poll in polls
        ]

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve polls."
        )


# --------------------------------
# PUBLIC: VIEW PUBLISHED POLLS
# --------------------------------

@router.get("/")
def get_public_polls(
    db: Session = Depends(get_db)
):

    try:
        polls = (
            db.query(Poll)
            .filter(Poll.is_published.is_(True))
            .order_by(Poll.created_at.desc())
            .all()
        )

        return [
            serialize_poll(poll, db, include_results=False)
            for poll in polls
        ]

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve polls."
        )


# --------------------------------
# PRESIDENT: CREATE POLL
# --------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_poll(
    poll_data: PollCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    options = clean_options(poll_data.options)

    new_poll = Poll(
        question=poll_data.question,
        description=poll_data.description,
        is_published=False,
        is_active=True
    )

    for option_text in options:
        new_poll.options.append(
            PollOption(option_text=option_text)
        )

    try:
        db.add(new_poll)
        db.commit()
        db.refresh(new_poll)

        return serialize_poll(
            new_poll,
            db,
            include_results=True
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create poll."
        )


# --------------------------------
# PUBLIC: VIEW POLL RESULTS
# --------------------------------

@router.get("/{poll_id}/results")
def get_poll_results(
    poll_id: int,
    db: Session = Depends(get_db)
):

    try:
        poll = (
            db.query(Poll)
            .filter(
                Poll.id == poll_id,
                Poll.is_published.is_(True)
            )
            .first()
        )

        if not poll:
            raise HTTPException(
                status_code=404,
                detail="Poll not found."
            )

        return serialize_poll(
            poll,
            db,
            include_results=True
        )

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve poll results."
        )


# --------------------------------
# PUBLIC: SUBMIT VOTE
# --------------------------------

@router.post("/{poll_id}/vote")
def submit_vote(
    poll_id: int,
    vote_data: VoteRequest,
    db: Session = Depends(get_db)
):

    try:
        poll = (
            db.query(Poll)
            .filter(
                Poll.id == poll_id,
                Poll.is_published.is_(True),
                Poll.is_active.is_(True)
            )
            .first()
        )

        if not poll:
            raise HTTPException(
                status_code=404,
                detail="This poll is unavailable or closed."
            )

        option = (
            db.query(PollOption)
            .filter(
                PollOption.id == vote_data.option_id,
                PollOption.poll_id == poll_id
            )
            .first()
        )

        if not option:
            raise HTTPException(
                status_code=400,
                detail="Invalid option for this poll."
            )

        existing_vote = (
            db.query(PollVote)
            .filter(
                PollVote.poll_id == poll_id,
                PollVote.voter_key == vote_data.voter_key
            )
            .first()
        )

        if existing_vote:
            raise HTTPException(
                status_code=409,
                detail="You have already voted in this poll."
            )

        new_vote = PollVote(
            poll_id=poll_id,
            option_id=option.id,
            voter_key=vote_data.voter_key
        )

        db.add(new_vote)
        db.commit()

        return {
            "message": "Your vote has been recorded successfully.",
            "poll_id": poll_id
        }

    except HTTPException:
        raise

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="You have already voted in this poll."
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Vote could not be recorded. Please try again."
        )


# --------------------------------
# PRESIDENT: UPDATE POLL
# --------------------------------

@router.put("/{poll_id}")
def update_poll(
    poll_id: int,
    poll_data: PollUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    poll = db.query(Poll).filter(
        Poll.id == poll_id
    ).first()

    if not poll:
        raise HTTPException(
            status_code=404,
            detail="Poll not found."
        )

    update_data = poll_data.model_dump(exclude_unset=True)

    if "question" in update_data:

        if update_data["question"] is None:
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty."
            )

        poll.question = update_data["question"]

    if "description" in update_data:
        poll.description = update_data["description"] or None

    if "options" in update_data:

        options = clean_options(update_data["options"])

        existing_votes = (
            db.query(func.count(PollVote.id))
            .filter(PollVote.poll_id == poll_id)
            .scalar()
        )

        if existing_votes > 0:
            raise HTTPException(
                status_code=400,
                detail="Options cannot be changed after voting has started."
            )

        poll.options.clear()

        for option_text in options:
            poll.options.append(
                PollOption(option_text=option_text)
            )

    commit_changes(db)

    db.refresh(poll)

    return serialize_poll(
        poll,
        db,
        include_results=True
    )


# --------------------------------
# PRESIDENT: PUBLISH / UNPUBLISH
# --------------------------------

@router.patch("/{poll_id}/publish")
def toggle_poll_publishing(
    poll_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    poll = db.query(Poll).filter(
        Poll.id == poll_id
    ).first()

    if not poll:
        raise HTTPException(
            status_code=404,
            detail="Poll not found."
        )

    if not poll.is_published and len(poll.options) < 2:
        raise HTTPException(
            status_code=400,
            detail="A poll needs at least two options before publishing."
        )

    poll.is_published = not poll.is_published

    commit_changes(db)
    db.refresh(poll)

    return serialize_poll(
        poll,
        db,
        include_results=True
    )


# --------------------------------
# PRESIDENT: CLOSE / REOPEN POLL
# --------------------------------

@router.patch("/{poll_id}/close")
def toggle_poll_status(
    poll_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    poll = db.query(Poll).filter(
        Poll.id == poll_id
    ).first()

    if not poll:
        raise HTTPException(
            status_code=404,
            detail="Poll not found."
        )

    poll.is_active = not poll.is_active

    commit_changes(db)
    db.refresh(poll)

    return serialize_poll(
        poll,
        db,
        include_results=True
    )


# --------------------------------
# PRESIDENT: DELETE POLL
# --------------------------------

@router.delete("/{poll_id}")
def delete_poll(
    poll_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):

    poll = db.query(Poll).filter(
        Poll.id == poll_id
    ).first()

    if not poll:
        raise HTTPException(
            status_code=404,
            detail="Poll not found."
        )

    try:
        db.delete(poll)
        db.commit()

        return {
            "message": "Poll deleted successfully."
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete poll."
        )
