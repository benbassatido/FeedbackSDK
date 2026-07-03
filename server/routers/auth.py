import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from defaults import (
    DEFAULT_COLORS,
    DEFAULT_FORM_DESCRIPTION,
    DEFAULT_FORM_FIELDS,
    DEFAULT_FORM_TITLE,
)
from deps import EMAIL_RE
from schemas import AuthResponse, LoginRequest, RegisterRequest
from security import create_token, generate_api_key, hash_password, verify_password

router = APIRouter(tags=["auth"])


def seed_user_default_design(db: Session, owner_email: str) -> None:
    now = int(time.time() * 1000)
    db.add(
        models.FormDesign(
            owner_email=owner_email,
            name="default",
            title=DEFAULT_FORM_TITLE,
            description=DEFAULT_FORM_DESCRIPTION,
            fields=DEFAULT_FORM_FIELDS,
            background_color=DEFAULT_COLORS["background"],
            card_color=DEFAULT_COLORS["card"],
            title_color=DEFAULT_COLORS["title"],
            button_color=DEFAULT_COLORS["button"],
            created_at=now,
            updated_at=now,
        )
    )
    db.commit()


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
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


@router.post("/auth/login", response_model=AuthResponse)
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
