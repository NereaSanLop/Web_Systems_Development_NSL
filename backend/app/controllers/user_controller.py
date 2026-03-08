from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import User, Role

class UserController:
    @staticmethod
    def get_profile(current_user: User):
        """Lógica para obtener perfil del usuario"""
        return {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role.name
        }

    @staticmethod
    def get_all_users(db: Session):
        """Lógica para obtener todos los usuarios (solo admin)"""
        users = db.query(User).all()
        return [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.name
            } for u in users
        ]

    @staticmethod
    def delete_user(user_id: int, db: Session):
        """Lógica para borrar un usuario (solo admin)"""
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(user)
        db.commit()
        
        return {"message": "User deleted successfully"}

    @staticmethod
    def change_role(user_id: int, new_role: str, db: Session):
        """Lógica para cambiar el rol de un usuario (solo admin)"""
        if new_role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        role = db.query(Role).filter(Role.name == new_role).first()
        user.role_id = role.id
        db.commit()
        db.refresh(user)

        return {"message": f"Role updated to '{new_role}' successfully"}