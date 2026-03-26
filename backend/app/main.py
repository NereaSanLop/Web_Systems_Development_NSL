from fastapi import FastAPI
from .database import engine, Base, SessionLocal
from .models import Role, User
from .auth import hash_password
from .routers import auth_router, users_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router.router)
app.include_router(users_router.router)

@app.on_event("startup")
def create_roles():
    # Seed default roles and create the initial admin account.
    db = SessionLocal()
    for role_name in ["admin", "user"]:
        if not db.query(Role).filter(Role.name == role_name).first():
            db.add(Role(name=role_name))
    db.commit()

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not db.query(User).filter(User.email == "admin@admin.com").first():
        admin_user = User(
            name="Admin",
            email="admin@admin.com",
            hashed_password=hash_password("admin"),
            role_id=admin_role.id,
        )
        db.add(admin_user)
        db.commit()

    db.close()