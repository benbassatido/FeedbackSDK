from sqlalchemy.orm import Query, Session

import models
from schemas import DesignInput


def feedback_for_user(db: Session, user: models.User) -> Query:
    return db.query(models.Feedback).filter(models.Feedback.owner_email == user.email)


def get_feedback_row(db: Session, user: models.User, feedback_id: str) -> models.Feedback | None:
    return feedback_for_user(db, user).filter(models.Feedback.id == feedback_id).first()


def recent_feedback(db: Session, user: models.User, limit: int = 100) -> list[models.Feedback]:
    return (
        feedback_for_user(db, user)
        .order_by(models.Feedback.created_at.desc())
        .limit(limit)
        .all()
    )


def designs_for_user(db: Session, user: models.User) -> list[models.FormDesign]:
    return (
        db.query(models.FormDesign)
        .filter(models.FormDesign.owner_email == user.email)
        .order_by(models.FormDesign.name.asc())
        .all()
    )


def design_by_owner_name(db: Session, owner_email: str, name: str) -> models.FormDesign | None:
    return (
        db.query(models.FormDesign)
        .filter(
            models.FormDesign.owner_email == owner_email,
            models.FormDesign.name == name,
        )
        .first()
    )


def design_name_taken(
    db: Session, owner_email: str, name: str, exclude_id: int | None = None
) -> bool:
    query = db.query(models.FormDesign).filter(
        models.FormDesign.owner_email == owner_email,
        models.FormDesign.name == name,
    )
    if exclude_id is not None:
        query = query.filter(models.FormDesign.id != exclude_id)
    return query.first() is not None


def normalized_fields(payload: DesignInput) -> list[dict]:
    return [
        {**field.model_dump(by_alias=True), "order": index}
        for index, field in enumerate(payload.fields)
    ]
