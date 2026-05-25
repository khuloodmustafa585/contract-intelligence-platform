from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserResponse(UserBase):
    id: int
    is_verified: bool
    email_notifications_enabled: bool
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email_notifications_enabled: Optional[bool] = None
