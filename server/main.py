import base64
import re
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

import models
from database import Base, SessionLocal, engine, get_db
from security import (
    create_token,
    generate_api_key,
    hash_password,
    verify_password,
    verify_token,
)
from schemas import (
    ALLOWED_STATUSES,
    AuthResponse,
    DesignInput,
    DesignResponse,
    FeedbackCreate,
    FeedbackCreatedResponse,
    FeedbackResponse,
    FeedbackStatusUpdate,
    LoginRequest,
    RegisterRequest,
    validate_design,
)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def feedback_for_user(db: Session, user: models.User):
    return db.query(models.Feedback).filter(models.Feedback.owner_email == user.email)


def user_for_api_key(db: Session, api_key: str | None) -> models.User:
    if not api_key or not api_key.strip():
        raise HTTPException(status_code=401, detail="Missing API key.")
    user = db.query(models.User).filter(models.User.api_key == api_key.strip()).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    return user


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    email = verify_token(authorization[len("Bearer ") :])
    if email is None:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    user = db.get(models.User, email)
    if user is None:
        raise HTTPException(status_code=401, detail="Account no longer exists.")
    return user

DEFAULT_FORM_FIELDS = [
    {
        "fieldId": "feedback_type",
        "type": "dropdown",
        "label": "Feedback Type",
        "required": True,
        "order": 1,
        "options": ["Bug", "Feature Request", "General", "Other"],
        "maxLength": None,
    },
    {
        "fieldId": "rating",
        "type": "rating",
        "label": "Rating",
        "required": True,
        "order": 2,
        "options": None,
        "maxLength": None,
    },
    {
        "fieldId": "message",
        "type": "text",
        "label": "Message",
        "required": True,
        "order": 3,
        "options": None,
        "maxLength": 500,
    },
]


def seed_user_default_design(db: Session, owner_email: str) -> None:
    now = int(time.time() * 1000)
    db.add(
        models.FormDesign(
            owner_email=owner_email,
            name="default",
            title="Send Feedback",
            description="We'd love to hear from you. Please fill out the form below.",
            fields=DEFAULT_FORM_FIELDS,
            background_color="#F4F5FB",
            card_color="#FFFFFF",
            title_color="#15172B",
            button_color="#4F46E5",
            created_at=now,
            updated_at=now,
        )
    )
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS screenshot BYTEA"))
        conn.execute(
            text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS viewed BOOLEAN NOT NULL DEFAULT FALSE")
        )
        conn.execute(
            text(
                "ALTER TABLE form_designs ADD COLUMN IF NOT EXISTS card_color VARCHAR NOT NULL DEFAULT '#FFFFFF'"
            )
        )
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS owner_email VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR"))
        conn.execute(text("ALTER TABLE form_designs ADD COLUMN IF NOT EXISTS owner_email VARCHAR"))
        conn.execute(text("ALTER TABLE form_designs DROP CONSTRAINT IF EXISTS form_designs_name_key"))
        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'uq_form_designs_owner_name'
                    ) THEN
                        ALTER TABLE form_designs
                            ADD CONSTRAINT uq_form_designs_owner_name UNIQUE (owner_email, name);
                    END IF;
                END $$;
                """
            )
        )
        conn.execute(text("DELETE FROM feedbacks WHERE owner_email IS NULL"))
        conn.execute(text("DELETE FROM form_designs WHERE owner_email IS NULL"))
    db = SessionLocal()
    try:
        for user in db.query(models.User).filter(models.User.api_key.is_(None)).all():
            user.api_key = generate_api_key()
        db.commit()
    finally:
        db.close()
    yield


app = FastAPI(title="Feedback SDK Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    full_name = payload.full_name.strip()
    email = payload.email.strip().lower()

    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="A valid email is required.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    if db.get(models.User, email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = models.User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(payload.password),
        api_key=generate_api_key(),
        created_at=int(time.time() * 1000),
    )
    db.add(user)
    db.commit()
    seed_user_default_design(db, user.email)
    return AuthResponse(
        token=create_token(user.email),
        email=user.email,
        full_name=user.full_name,
        api_key=user.api_key,
    )


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.get(models.User, email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.api_key:
        user.api_key = generate_api_key()
        db.commit()
    return AuthResponse(
        token=create_token(user.email),
        email=user.email,
        full_name=user.full_name,
        api_key=user.api_key,
    )


@app.post("/feedback", response_model=FeedbackCreatedResponse, status_code=201)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias="X-Api-Key"),
):
    owner = user_for_api_key(db, x_api_key)

    screenshot_bytes = None
    screenshot_url = payload.screenshot_url
    if payload.screenshot_base64:
        screenshot_bytes = base64.b64decode(payload.screenshot_base64)
        screenshot_url = f"/feedback/{payload.feedback_id}/screenshot"

    feedback = models.Feedback(
        id=payload.feedback_id,
        owner_email=owner.email,
        user_id=payload.user_id,
        user_email=payload.user_email,
        answers=payload.answers,
        feedback_metadata=payload.metadata,
        status=payload.status,
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


@app.get("/feedback", response_model=list[FeedbackResponse])
def list_feedback(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = (
        feedback_for_user(db, user)
        .order_by(models.Feedback.created_at.desc())
        .limit(100)
        .all()
    )
    return [FeedbackResponse.from_row(r) for r in rows]


@app.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    row = feedback_for_user(db, user).filter(models.Feedback.id == feedback_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return FeedbackResponse.from_row(row)


@app.get("/feedback/{feedback_id}/screenshot")
def get_screenshot(feedback_id: str, db: Session = Depends(get_db)):
    row = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if row is None or row.screenshot is None:
        raise HTTPException(status_code=404, detail="No screenshot")
    return Response(content=row.screenshot, media_type="image/jpeg")


@app.patch("/feedback/{feedback_id}/status", response_model=FeedbackResponse)
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
    row = feedback_for_user(db, user).filter(models.Feedback.id == feedback_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    row.status = payload.status
    row.updated_at = int(time.time() * 1000)
    db.commit()
    db.refresh(row)
    return FeedbackResponse.from_row(row)


@app.patch("/feedback/{feedback_id}/viewed", response_model=FeedbackResponse)
def mark_feedback_viewed(
    feedback_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    row = feedback_for_user(db, user).filter(models.Feedback.id == feedback_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    row.viewed = True
    db.commit()
    db.refresh(row)
    return FeedbackResponse.from_row(row)


def _normalized_fields(payload: DesignInput) -> list[dict]:
    return [
        {**field.model_dump(by_alias=True), "order": index}
        for index, field in enumerate(payload.fields)
    ]


@app.get("/designs", response_model=list[DesignResponse])
def list_designs(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.FormDesign)
        .filter(models.FormDesign.owner_email == user.email)
        .order_by(models.FormDesign.name.asc())
        .all()
    )
    return [DesignResponse.from_row(r) for r in rows]


@app.get("/designs/by-name/{name}", response_model=DesignResponse)
def get_design_by_name(
    name: str,
    db: Session = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias="X-Api-Key"),
):
    owner = user_for_api_key(db, x_api_key)
    row = (
        db.query(models.FormDesign)
        .filter(
            models.FormDesign.owner_email == owner.email,
            models.FormDesign.name == name,
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Design not found")
    return DesignResponse.from_row(row)


@app.post("/designs", response_model=DesignResponse, status_code=201)
def create_design(
    payload: DesignInput,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    error = validate_design(payload)
    if error is not None:
        raise HTTPException(status_code=400, detail=error)

    name = payload.name.strip()
    clash = (
        db.query(models.FormDesign)
        .filter(
            models.FormDesign.owner_email == user.email,
            models.FormDesign.name == name,
        )
        .first()
    )
    if clash is not None:
        raise HTTPException(status_code=409, detail="A design with this name already exists.")

    now = int(time.time() * 1000)
    design = models.FormDesign(
        owner_email=user.email,
        name=name,
        title=payload.title.strip(),
        description=payload.description,
        fields=_normalized_fields(payload),
        background_color=payload.background_color,
        card_color=payload.card_color,
        title_color=payload.title_color,
        button_color=payload.button_color,
        created_at=now,
        updated_at=now,
    )
    db.add(design)
    db.commit()
    db.refresh(design)
    return DesignResponse.from_row(design)


@app.put("/designs/{design_id}", response_model=DesignResponse)
def update_design(
    design_id: int,
    payload: DesignInput,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    error = validate_design(payload)
    if error is not None:
        raise HTTPException(status_code=400, detail=error)

    design = db.get(models.FormDesign, design_id)
    if design is None or design.owner_email != user.email:
        raise HTTPException(status_code=404, detail="Design not found")

    name = payload.name.strip()
    clash = (
        db.query(models.FormDesign)
        .filter(
            models.FormDesign.owner_email == user.email,
            models.FormDesign.name == name,
            models.FormDesign.id != design_id,
        )
        .first()
    )
    if clash is not None:
        raise HTTPException(status_code=409, detail="A design with this name already exists.")

    design.name = name
    design.title = payload.title.strip()
    design.description = payload.description
    design.fields = _normalized_fields(payload)
    design.background_color = payload.background_color
    design.card_color = payload.card_color
    design.title_color = payload.title_color
    design.button_color = payload.button_color
    design.updated_at = int(time.time() * 1000)
    db.commit()
    db.refresh(design)
    return DesignResponse.from_row(design)


@app.delete("/designs/{design_id}")
def delete_design(
    design_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    design = db.get(models.FormDesign, design_id)
    if design is None or design.owner_email != user.email:
        raise HTTPException(status_code=404, detail="Design not found")
    db.delete(design)
    db.commit()
    return {"deleted": design_id}
