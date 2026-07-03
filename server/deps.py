import re

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from security import verify_token

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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
