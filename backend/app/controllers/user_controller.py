from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import User, Role, Transaction

class UserController:
    @staticmethod
    def get_profile(current_user: User):
        """Return profile data for the authenticated user."""
        return {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role.name,
            "credits": current_user.credits,
            "is_active": current_user.is_active,
        }

    @staticmethod
    def get_all_users(db: Session):
        """List all users for admin-only access."""
        users = db.query(User).all()
        return [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.name,
                "credits": u.credits,
                "is_active": u.is_active,
            } for u in users
        ]

    @staticmethod
    def delete_user(user_id: int, db: Session):
        """Delete a user by ID for admin-only access."""
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        db.delete(user)
        db.commit()

        return {"message": "User deleted successfully"}

    @staticmethod
    def toggle_active(user_id: int, requesting_admin_id: int, db: Session):
        """Toggle a user's active status. Admins cannot deactivate themselves."""
        if user_id == requesting_admin_id:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = not user.is_active
        db.commit()
        db.refresh(user)

        status_label = "activated" if user.is_active else "deactivated"
        return {"message": f"User {status_label} successfully", "is_active": user.is_active}

    @staticmethod
    def change_role(user_id: int, new_role: str, db: Session):
        """Update a user's role to admin or user."""
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

    @staticmethod
    def get_my_transactions(current_user: User, db: Session):
        """Return transaction history for the authenticated user."""
        return (
            db.query(Transaction)
            .filter(Transaction.user_email == current_user.email)
            .order_by(Transaction.id.desc())
            .all()
        )

    @staticmethod
    def get_all_transactions_admin(db: Session):
        """Return all transactions for admin monitoring."""
        return (
            db.query(Transaction)
            .order_by(Transaction.id.desc())
            .all()
        )
