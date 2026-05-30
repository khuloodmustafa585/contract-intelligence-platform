from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserCreate(BaseModel):
    """Schema for registration — collects first/last name separately."""
    first_name: str = Field(min_length=1, max_length=255)
    last_name: str = Field(default="", max_length=255)
    email: EmailStr
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: int
    email: EmailStr

    # Display name (kept for backward compat — computed from first/last on write)
    full_name: str

    # Structured name fields (nullable for existing users)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_title: Optional[str] = None

    is_verified: bool
    email_notifications_enabled: bool

    department: Optional[str] = None
    company: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    # Structured name fields (preferred)
    first_name: Optional[str] = Field(None, min_length=1, max_length=255)
    last_name: Optional[str] = Field(None, max_length=255)
    job_title: Optional[str] = Field(None, max_length=255)

    # Legacy display-name field (settings page / existing callers)
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)

    email_notifications_enabled: Optional[bool] = None
    department: Optional[str] = Field(None, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = Field(None, max_length=500)
