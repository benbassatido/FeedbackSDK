import base64
import binascii
import time

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlalchemy.orm import Session

import models
import repositories
from database import get_db
from deps import get_current_user, user_for_api_key
from schemas import (
    ALLOWED_STATUSES,
    FeedbackCreate,
    FeedbackCreatedResponse,
    FeedbackResponse,
    FeedbackStatusUpdate,
)

router = APIRouter(tags=["feedback"])


@router.post("/feedback", response_model=FeedbackCreatedResponse, status_code=201)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias="X-Api-Key"),
):
    owner = user_for_api_key(db, x_api_key)

    screenshot_bytes = None
    screenshot_url = None
    if payload.screenshot_base64:
        try:
            screenshot_bytes = base64.b64decode(payload.screenshot_base64, validate=True)
        except (ValueError, binascii.Error):
            raise HTTPException(status_code=400, detail="Invalid screenshot encoding.")
        screenshot_url = f"/feedback/{payload.feedback_id}/screenshot"

    feedback = models.Feedback(
        id=payload.feedback_id,
        owner_email=owner.email,
        user_id=payload.user_id,
        user_email=payload.user_email,
        answers=payload.answers,
        feedback_metadata=payload.metadata,
        status="pending",
        created_at=payload.created_at,
        updated_at=payload.updated_at,
        screenshot_url=screenshot_url,
        screenshot=screenshot_bytes,
        device_info=payload.device_info.model_dump(by_alias=True) if payload.device_info else None,
        app_info=payload.app_info.model_dump(by_alias=True) if payload.app_info else None,
    )
    db.merge(feedback)
    db.commit()
    return FeedbackCreatedResponse(feedback_id=payload.feedback_id)


@router.get("/feedback", response_model=list[FeedbackResponse])
def list_feedback(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = repositories.recent_feedback(db, user)
    return [FeedbackResponse.from_row(r) for r in rows]


@router.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    row = repositories.get_feedback_row(db, user, feedback_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return FeedbackResponse.from_row(row)


@router.get("/feedback/{feedback_id}/screenshot")
def get_screenshot(
    feedback_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    row = repositories.get_feedback_row(db, user, feedback_id)
    if row is None or row.screenshot is None:
        raise HTTPException(status_code=404, detail="No screenshot")
    return Response(content=row.screenshot, media_type="image/jpeg")


@router.patch("/feedback/{feedback_id}/status", response_model=FeedbackResponse)
def update_feedback_status(
    feedback_id: str,
    payload: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}",
        )
    row = repositories.get_feedback_row(db, user, feedback_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    row.status = payload.status
    row.updated_at = int(time.time() * 1000)
    db.commit()
    db.refresh(row)
    return FeedbackResponse.from_row(row)


@router.patch("/feedback/{feedback_id}/viewed", response_model=FeedbackResponse)
def mark_feedback_viewed(
    feedback_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    row = repositories.get_feedback_row(db, user, feedback_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    row.viewed = True
    db.commit()
    db.refresh(row)
    return FeedbackResponse.from_row(row)
