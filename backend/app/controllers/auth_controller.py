from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import User, Role
from ..auth import hash_password, verify_password, create_access_token

class AuthController:
    @staticmethod
    def signup(name: str, email: str, password: str, db: Session):
        """Register a new user with the default role."""
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        role = db.query(Role).filter(Role.name == "user").first()
        
        new_user = User(
            name=name,
            email=email,
            hashed_password=hash_password(password),
            role_id=role.id
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"message": "User created successfully"}

    @staticmethod
    def login(email: str, password: str, db: Session):
        """Authenticate a user and return an access token."""
        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user or not verify_password(password, db_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token({
            "user_id": db_user.id,
            "role": db_user.role.name
        })
        
        return {"access_token": token}