from fastapi import FastAPI
from sqlalchemy import text
from .database import engine, Base, SessionLocal
from .models import Role, User, Service, ServiceRequest, Transaction, StripePayment, ServiceReview
from .auth import hash_password
from .routers import auth_router, users_router, services_router
from .routers import payment_router
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


def ensure_schema():
    """Apply incremental migrations for columns added after initial deployment."""
    with engine.connect() as connection:
        # ── users ──
        user_cols = [col[1] for col in connection.execute(text("PRAGMA table_info(users)")).fetchall()]
        if "credits" not in user_cols:
            connection.execute(text("ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 10"))
        if "is_active" not in user_cols:
            connection.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))

        # ── services ──
        service_cols = [col[1] for col in connection.execute(text("PRAGMA table_info(services)")).fetchall()]
        if "is_visible" not in service_cols:
            connection.execute(text("ALTER TABLE services ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT 1"))

        connection.commit()


ensure_schema()

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(services_router.router)
app.include_router(payment_router.router)

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
            is_active=True,
            role_id=admin_role.id,
        )
        db.add(admin_user)
        db.commit()

    db.close()
