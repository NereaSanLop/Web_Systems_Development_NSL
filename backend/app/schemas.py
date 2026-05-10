from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    credits: int
    is_active: bool = True

    class Config:
        from_attributes = True


class ServiceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    cost: int = Field(gt=0)


class ServiceUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    cost: int = Field(gt=0)


class ServiceResponse(BaseModel):
    id: int
    title: str
    cost: int
    owner_email: str
    is_visible: bool = True
    avg_rating: Optional[float] = None
    review_count: int = 0

    class Config:
        from_attributes = True


class ServiceRequestResponse(BaseModel):
    id: int
    service_id: int
    requester_email: str
    provider_email: str
    cost: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    user_email: str
    counterparty_email: str
    service_id: Optional[int] = None
    service_request_id: Optional[int] = None
    amount: int
    direction: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    credits: int = Field(gt=0, le=500)


class PaymentResponse(BaseModel):
    checkout_url: str


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


class ReviewResponse(BaseModel):
    id: int
    service_request_id: int
    service_id: int
    reviewer_email: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
