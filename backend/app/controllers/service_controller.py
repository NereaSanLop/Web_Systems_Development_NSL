from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models import Service, ServiceRequest, Transaction, User


class ServiceController:
    @staticmethod
    def _get_service_request_or_404(request_id: int, db: Session):
        service_request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        return service_request

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

    @staticmethod
    def request_service(service_id: int, current_user: User, db: Session):
        """Create a service request for a service owned by another user."""
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        if service.owner_email == current_user.email:
            raise HTTPException(status_code=400, detail="You cannot request your own service")

        if current_user.credits < service.cost:
            raise HTTPException(status_code=400, detail="You do not have enough credits for this service")

        # Allow only one open request per requester/service pair.
        existing_open_request = (
            db.query(ServiceRequest)
            .filter(
                ServiceRequest.service_id == service.id,
                ServiceRequest.requester_email == current_user.email,
                ServiceRequest.status.in_(["requested", "accepted"]),
            )
            .first()
        )
        if existing_open_request:
            raise HTTPException(status_code=400, detail="You already have a pending request for this service")

        service_request = ServiceRequest(
            service_id=service.id,
            requester_email=current_user.email,
            provider_email=service.owner_email,
            cost=service.cost,
            status="requested",
        )
        db.add(service_request)
        db.commit()
        db.refresh(service_request)
        return service_request

    @staticmethod
    def list_incoming_requests(current_user: User, db: Session):
        """Return requests received by the authenticated provider."""
        return (
            db.query(ServiceRequest)
            .filter(ServiceRequest.provider_email == current_user.email)
            .order_by(ServiceRequest.id.desc())
            .all()
        )

    @staticmethod
    def list_outgoing_requests(current_user: User, db: Session):
        """Return requests created by the authenticated requester."""
        return (
            db.query(ServiceRequest)
            .filter(ServiceRequest.requester_email == current_user.email)
            .order_by(ServiceRequest.id.desc())
            .all()
        )

    @staticmethod
    def accept_request(request_id: int, current_user: User, db: Session):
        """Accept a pending request without transferring credits yet."""
        service_request = ServiceController._get_service_request_or_404(request_id, db)

        if service_request.provider_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized")

        if service_request.status != "requested":
            raise HTTPException(status_code=400, detail="Only requested services can be accepted")

        # Acceptance moves the request to active state; settlement happens on completion.
        service_request.status = "accepted"

        db.commit()
        db.refresh(service_request)
        return service_request

    @staticmethod
    def reject_request(request_id: int, current_user: User, db: Session):
        """Reject a pending request as the provider."""
        service_request = ServiceController._get_service_request_or_404(request_id, db)

        if service_request.provider_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized")

        if service_request.status != "requested":
            raise HTTPException(status_code=400, detail="Only requested services can be rejected")

        service_request.status = "rejected"
        db.commit()
        db.refresh(service_request)
        return service_request

    @staticmethod
    def cancel_request(request_id: int, current_user: User, db: Session):
        """Cancel a request as either the requester or the provider."""
        service_request = ServiceController._get_service_request_or_404(request_id, db)

        if current_user.email not in {service_request.requester_email, service_request.provider_email}:
            raise HTTPException(status_code=403, detail="Not authorized")

        if service_request.status in {"rejected", "cancelled", "completed"}:
            raise HTTPException(status_code=400, detail="This request is already closed")

        service_request.status = "cancelled"
        db.commit()
        db.refresh(service_request)
        return service_request

    @staticmethod
    def complete_request(request_id: int, current_user: User, db: Session):
        """Complete an accepted request and transfer credits safely."""
        service_request = ServiceController._get_service_request_or_404(request_id, db)

        if service_request.provider_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized")

        if service_request.status != "accepted":
            raise HTTPException(status_code=400, detail="Only accepted services can be completed")

        requester = db.query(User).filter(User.email == service_request.requester_email).first()
        provider = db.query(User).filter(User.email == service_request.provider_email).first()

        if not requester or not provider:
            raise HTTPException(status_code=404, detail="User not found")

        if requester.credits < service_request.cost:
            raise HTTPException(status_code=400, detail="Requester does not have enough credits")

        # Settlement step: requester pays provider when service is marked complete.
        requester.credits -= service_request.cost
        provider.credits += service_request.cost
        service_request.status = "completed"

        # Store mirrored ledger entries so each user has their own movement history.
        requester_tx = Transaction(
            user_email=requester.email,
            counterparty_email=provider.email,
            service_id=service_request.service_id,
            service_request_id=service_request.id,
            amount=service_request.cost,
            direction="debit",
            reason="service_payment",
        )
        provider_tx = Transaction(
            user_email=provider.email,
            counterparty_email=requester.email,
            service_id=service_request.service_id,
            service_request_id=service_request.id,
            amount=service_request.cost,
            direction="credit",
            reason="service_payment",
        )
        db.add(requester_tx)
        db.add(provider_tx)

        db.commit()
        db.refresh(service_request)
        return service_request
