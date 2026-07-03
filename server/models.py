from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB

from database import Base
from defaults import DEFAULT_COLORS


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String, primary_key=True)
    owner_email = Column(String, nullable=True, index=True)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    answers = Column(JSONB, nullable=False, default=dict)
    feedback_metadata = Column("metadata", JSONB, nullable=False, default=dict)
    status = Column(String, nullable=False, default="pending")
    viewed = Column(Boolean, nullable=False, default=False)
    created_at = Column(BigInteger, nullable=False)
    updated_at = Column(BigInteger, nullable=False)
    screenshot_url = Column(String, nullable=True)
    screenshot = Column(LargeBinary, nullable=True)
    device_info = Column(JSONB, nullable=True)
    app_info = Column(JSONB, nullable=True)


class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    api_key = Column(String, nullable=True, unique=True, index=True)
    created_at = Column(BigInteger, nullable=False)


class FormDesign(Base):
    __tablename__ = "form_designs"
    __table_args__ = (
        UniqueConstraint("owner_email", "name", name="uq_form_designs_owner_name"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_email = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    fields = Column(JSONB, nullable=False, default=list)
    background_color = Column(String, nullable=False, default=DEFAULT_COLORS["background"])
    card_color = Column(String, nullable=False, default=DEFAULT_COLORS["card"])
    title_color = Column(String, nullable=False, default=DEFAULT_COLORS["title"])
    button_color = Column(String, nullable=False, default=DEFAULT_COLORS["button"])
    created_at = Column(BigInteger, nullable=False)
    updated_at = Column(BigInteger, nullable=False)
