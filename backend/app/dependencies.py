from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .auth import decode_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Resolve the authenticated user from the bearer token.
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_admin_user(current_user: User = Depends(get_current_user)):
    # Allow access only when the current user is an admin.
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user