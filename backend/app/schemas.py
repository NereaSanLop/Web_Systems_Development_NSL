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

    class Config:
        from_attributes = True