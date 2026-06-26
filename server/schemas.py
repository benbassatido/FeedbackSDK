import re
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class DeviceInfoSchema(CamelModel):
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    android_version: Optional[str] = Field(default=None, alias="androidVersion")
    locale: Optional[str] = None
    screen_size: Optional[str] = Field(default=None, alias="screenSize")


class AppInfoSchema(CamelModel):
    package_name: Optional[str] = Field(default=None, alias="packageName")
    app_version_name: Optional[str] = Field(default=None, alias="appVersionName")
    app_version_code: Optional[int] = Field(default=None, alias="appVersionCode")
    build_type: Optional[str] = Field(default=None, alias="buildType")


class FeedbackCreate(CamelModel):
    feedback_id: str = Field(alias="feedbackId")
    user_id: Optional[str] = Field(default=None, alias="userId")
    user_email: Optional[str] = Field(default=None, alias="userEmail")
    answers: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, str] = Field(default_factory=dict)
    status: str = "pending"
    created_at: int = Field(alias="createdAt")
    updated_at: int = Field(alias="updatedAt")
    screenshot_url: Optional[str] = Field(default=None, alias="screenshotUrl")
    screenshot_base64: Optional[str] = Field(default=None, alias="screenshotBase64")
    device_info: Optional[DeviceInfoSchema] = Field(default=None, alias="deviceInfo")
    app_info: Optional[AppInfoSchema] = Field(default=None, alias="appInfo")


class FeedbackCreatedResponse(CamelModel):
    feedback_id: str = Field(serialization_alias="feedbackId")


class FeedbackResponse(CamelModel):
    feedback_id: str = Field(serialization_alias="feedbackId")
    user_id: Optional[str] = Field(default=None, serialization_alias="userId")
    user_email: Optional[str] = Field(default=None, serialization_alias="userEmail")
    answers: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, str] = Field(default_factory=dict)
    status: str
    viewed: bool = False
    created_at: int = Field(serialization_alias="createdAt")
    updated_at: int = Field(serialization_alias="updatedAt")
    screenshot_url: Optional[str] = Field(default=None, serialization_alias="screenshotUrl")
    device_info: Optional[dict] = Field(default=None, serialization_alias="deviceInfo")
    app_info: Optional[dict] = Field(default=None, serialization_alias="appInfo")

    @classmethod
    def from_row(cls, r):
        return cls(
            feedback_id=r.id,
            user_id=r.user_id,
            user_email=r.user_email,
            answers=r.answers,
            metadata=r.feedback_metadata,
            status=r.status,
            viewed=bool(r.viewed),
            created_at=r.created_at,
            updated_at=r.updated_at,
            screenshot_url=r.screenshot_url,
            device_info=r.device_info,
            app_info=r.app_info,
        )


ALLOWED_STATUSES = ["pending", "in_progress", "resolved", "archived"]


class FeedbackStatusUpdate(CamelModel):
    status: str


class RegisterRequest(CamelModel):
    full_name: str = Field(alias="fullName")
    email: str
    password: str


class LoginRequest(CamelModel):
    email: str
    password: str


class AuthResponse(CamelModel):
    token: str
    email: str
    full_name: str = Field(serialization_alias="fullName")
    api_key: str = Field(serialization_alias="apiKey")


HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


class FeedbackField(CamelModel):
    field_id: str = Field(alias="fieldId")
    type: str
    label: str
    required: bool = False
    order: int = 0
    options: Optional[list[str]] = None
    max_length: Optional[int] = Field(default=None, alias="maxLength")


ALLOWED_FIELD_TYPES = {"text", "dropdown", "rating"}


class DesignInput(CamelModel):
    name: str
    title: str
    description: Optional[str] = None
    fields: list[FeedbackField] = Field(default_factory=list)
    background_color: str = Field(alias="backgroundColor")
    card_color: str = Field(alias="cardColor")
    title_color: str = Field(alias="titleColor")
    button_color: str = Field(alias="buttonColor")


class DesignResponse(CamelModel):
    id: int
    name: str
    title: str
    description: Optional[str] = None
    fields: list[FeedbackField] = Field(default_factory=list)
    background_color: str = Field(serialization_alias="backgroundColor")
    card_color: str = Field(serialization_alias="cardColor")
    title_color: str = Field(serialization_alias="titleColor")
    button_color: str = Field(serialization_alias="buttonColor")

    @classmethod
    def from_row(cls, r):
        return cls(
            id=r.id,
            name=r.name,
            title=r.title,
            description=r.description,
            fields=r.fields,
            background_color=r.background_color,
            card_color=r.card_color,
            title_color=r.title_color,
            button_color=r.button_color,
        )


def validate_fields(fields: list[FeedbackField]) -> Optional[str]:
    if not fields:
        return "Form must have at least one field."

    seen_ids: set[str] = set()
    for field in fields:
        if not field.field_id or not field.field_id.strip():
            return "Every field needs a fieldId."
        if field.field_id in seen_ids:
            return f"Duplicate fieldId: {field.field_id}"
        seen_ids.add(field.field_id)
        if not field.label or not field.label.strip():
            return "Every field needs a label."
        if field.type not in ALLOWED_FIELD_TYPES:
            return f"Unsupported field type: {field.type}"
        if field.type == "dropdown":
            options = [o for o in (field.options or []) if o and o.strip()]
            if not options:
                return f"Dropdown '{field.label}' must have at least one option."
    return None


def validate_design(design: DesignInput) -> Optional[str]:
    if not design.name or not design.name.strip():
        return "Design name must not be empty."
    if not design.title or not design.title.strip():
        return "Form title must not be empty."
    for color, label in (
        (design.background_color, "Background"),
        (design.card_color, "Card"),
        (design.title_color, "Title"),
        (design.button_color, "Button"),
    ):
        if not HEX_COLOR_RE.match(color or ""):
            return f"{label} color must be a hex value like #1A2B3C."
    return validate_fields(design.fields)
