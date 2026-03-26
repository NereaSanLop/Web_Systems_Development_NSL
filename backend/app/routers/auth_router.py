from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserCreate, UserLogin
from ..controllers import AuthController

router = APIRouter()

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Handle user signup through the auth controller."""
    return AuthController.signup(user.name, user.email, user.password, db)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Handle user login through the auth controller."""
    return AuthController.login(user.email, user.password, db)