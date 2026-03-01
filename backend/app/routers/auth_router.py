from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserCreate, UserLogin
from ..controllers import AuthController

router = APIRouter()

@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Endpoint de signup - solo llama al controller"""
    return AuthController.signup(user.name, user.email, user.password, user.is_admin, db)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Endpoint de login - solo llama al controller"""
    return AuthController.login(user.email, user.password, db)