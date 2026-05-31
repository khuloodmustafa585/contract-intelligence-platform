from pydantic import BaseModel, EmailStr, ConfigDict, Field

class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserResponse(UserBase):
    id: int
    is_verified: bool
    model_config=ConfigDict(from_attributes=True)
    