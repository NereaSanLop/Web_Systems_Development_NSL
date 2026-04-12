from fastapi import FastAPI
from sqlalchemy import text
from .database import engine, Base, SessionLocal
from .models import Role, User, Service
from .auth import hash_password
from .routers import auth_router, users_router, services_router
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


def ensure_user_credits_column():
    # For existing SQLite files, add the new credits column if missing.
    with engine.connect() as connection:
        columns = connection.execute(text("PRAGMA table_info(users)")).fetchall()
        column_names = [col[1] for col in columns]
        if "credits" not in column_names:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 10")
            )
            connection.commit()


ensure_user_credits_column()

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(services_router.router)

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
            credits=10,
            role_id=admin_role.id,
        )
        db.add(admin_user)
        db.commit()

    db.close()