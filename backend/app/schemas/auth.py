from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserSignup(BaseModel):
    full_name: str = Field(..., min_length=2)
    email_or_phone: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email_or_phone: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email_or_phone: str
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
