from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import Service, User


class ServiceController:
    @staticmethod
    def list_my_services(current_user: User, db: Session):
        """Return services owned by the authenticated user."""
        return (
            db.query(Service)
            .filter(Service.owner_email == current_user.email)
            .order_by(Service.id.desc())
            .all()
        )

    @staticmethod
    def browse_services(
        current_user: User,
        db: Session,
        query: str | None = None,
        min_cost: int | None = None,
        max_cost: int | None = None,
    ):
        """Return services from other users with optional simple filters."""
        services_query = db.query(Service).filter(Service.owner_email != current_user.email)

        if query:
            services_query = services_query.filter(Service.title.ilike(f"%{query.strip()}%"))

        if min_cost is not None:
            services_query = services_query.filter(Service.cost >= min_cost)

        if max_cost is not None:
            services_query = services_query.filter(Service.cost <= max_cost)

        return services_query.order_by(Service.id.desc()).all()

    @staticmethod
    def create_service(title: str, cost: int, current_user: User, db: Session):
        """Create a new service linked to the authenticated user email."""
        service = Service(
            title=title.strip(),
            cost=cost,
            owner_email=current_user.email,
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        return service

    @staticmethod
    def update_service(service_id: int, title: str, cost: int, current_user: User, db: Session):
        """Update an existing user-owned service."""
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        if service.owner_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized")

        service.title = title.strip()
        service.cost = cost
        db.commit()
        db.refresh(service)
        return service

    @staticmethod
    def delete_service(service_id: int, current_user: User, db: Session):
        """Delete an existing user-owned service."""
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        if service.owner_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized")

        db.delete(service)
        db.commit()
        return {"message": "Service deleted successfully"}
