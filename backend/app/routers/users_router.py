from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserResponse
from ..models import User
from ..dependencies import get_current_user, get_admin_user
from ..controllers import UserController

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Endpoint para obtener perfil - solo llama al controller"""
    return UserController.get_profile(current_user)

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Endpoint para obtener usuarios - solo llama al controller"""
    return UserController.get_all_users(db)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Endpoint para borrar un usuario - solo admin"""
    return UserController.delete_user(user_id, db)

@router.put("/users/{user_id}/role")
def change_role(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Endpoint para cambiar el rol de un usuario - solo admin"""
    new_role = body.get("role")
    return UserController.change_role(user_id, new_role, db)