from typing import Optional
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..models import Service, ServiceRequest, ServiceReview, Transaction, User


class ServiceController:
    @staticmethod
    def _get_service_request_or_404(request_id: int, db: Session):
        """Retrieve a service request by ID or raise a 404 HTTPException if not found."""
        service_request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        return service_request

    @staticmethod
    def _enrich_services_with_ratings(services, db: Session):
        """Attach avg_rating and review_count to a list of Service ORM objects."""
        if not services:
            return []

        service_ids = [s.id for s in services]
        rating_rows = (
            db.query(
                ServiceReview.service_id,
                func.avg(ServiceReview.rating).label("avg_rating"),
                func.count(ServiceReview.id).label("review_count"),
            )
            .filter(ServiceReview.service_id.in_(service_ids))
            .group_by(ServiceReview.service_id)
            .all()
        )
        rating_map = {r.service_id: (r.avg_rating, r.review_count) for r in rating_rows}

        result = []
        for s in services:
            avg, count = rating_map.get(s.id, (None, 0))
            result.append({
                "id": s.id,
                "title": s.title,
                "cost": s.cost,
                "owner_email": s.owner_email,
                "is_visible": s.is_visible,
                "avg_rating": round(float(avg), 2) if avg is not None else None,
                "review_count": count,
            })
        return result

    @staticmethod
    def list_my_services(current_user: User, db: Session):
        """Return services owned by the authenticated user."""
        services = (
            db.query(Service)
            .filter(Service.owner_email == current_user.email)
            .order_by(Service.id.desc())
            .all()
        )
        return ServiceController._enrich_services_with_ratings(services, db)

    @staticmethod
    def browse_services(
        current_user: User,
        db: Session,
        query: Optional[str] = None,
        min_cost: Optional[int] = None,
        max_cost: Optional[int] = None,
    ):
        """Return services from other users with optional simple filters."""
        services_query = db.query(Service).filter(
            Service.owner_email != current_user.email,
            Service.is_visible == True,
        )

        if query:
            services_query = services_query.filter(Service.title.ilike(f"%{query.strip()}%"))

        if min_cost is not None:
            services_query = services_query.filter(Service.cost >= min_cost)

        if max_cost is not None:
            services_query = services_query.filter(Service.cost <= max_cost)

        services = services_query.order_by(Service.id.desc()).all()
        return ServiceController._enrich_services_with_ratings(services, db)

    @staticmethod
    def list_all_services(db: Session):
        """Return all services for admin-only management views."""
        services = db.query(Service).order_by(Service.id.desc()).all()
        return ServiceController._enrich_services_with_ratings(services, db)

    @staticmethod
    def create_service(title: str, cost: int, current_user: User, db: Session):
        """Create a new service linked to the authenticated user email."""
        service = Service(
            title=title.strip(),
            cost=cost,
            owner_email=current_user.email,
            is_visible=True,
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        return {"id": service.id, "title": service.title, "cost": service.cost,
                "owner_email": service.owner_email, "is_visible": service.is_visible,
                "avg_rating": None, "review_count": 0}

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

        enriched = ServiceController._enrich_services_with_ratings([service], db)
        return enriched[0]

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
    def admin_delete_service(service_id: int, db: Session):
        """Delete any service by ID for admin-only access."""
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        db.delete(service)
        db.commit()
        return {"message": "Service deleted successfully"}

    @staticmethod
    def admin_toggle_visibility(service_id: int, db: Session):
        """Toggle a service's visibility. Hidden services won't appear in browse."""
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        service.is_visible = not service.is_visible
        db.commit()
        db.refresh(service)

        label = "visible" if service.is_visible else "hidden"
        return {"message": f"Service is now {label}", "is_visible": service.is_visible}

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
    def list_all_requests_admin(db: Session):
        """Return all service requests for admin monitoring."""
        return (
            db.query(ServiceRequest)
            .order_by(ServiceRequest.id.desc())
            .all()
        )

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

    # ── Review methods ──────────────────────────────────────────────────────────

    @staticmethod
    def create_review(request_id: int, rating: int, comment: Optional[str], current_user: User, db: Session):
        """Submit a review for a completed service request (requester only, once)."""
        service_request = ServiceController._get_service_request_or_404(request_id, db)

        if service_request.requester_email != current_user.email:
            raise HTTPException(status_code=403, detail="Only the requester can review this service")

        if service_request.status != "completed":
            raise HTTPException(status_code=400, detail="You can only review completed services")

        existing = db.query(ServiceReview).filter(
            ServiceReview.service_request_id == request_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="You already submitted a review for this service")

        review = ServiceReview(
            service_request_id=request_id,
            service_id=service_request.service_id,
            reviewer_email=current_user.email,
            rating=rating,
            comment=comment,
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def get_reviews_for_service(service_id: int, db: Session):
        """Return all reviews for a specific service."""
        return (
            db.query(ServiceReview)
            .filter(ServiceReview.service_id == service_id)
            .order_by(ServiceReview.id.desc())
            .all()
        )

    @staticmethod
    def get_my_reviews(current_user: User, db: Session):
        """Return reviews submitted by the current user."""
        return (
            db.query(ServiceReview)
            .filter(ServiceReview.reviewer_email == current_user.email)
            .order_by(ServiceReview.id.desc())
            .all()
        )

    @staticmethod
    def get_all_reviews_admin(db: Session):
        """Return all reviews for admin moderation."""
        return db.query(ServiceReview).order_by(ServiceReview.id.desc()).all()

    @staticmethod
    def delete_review_admin(review_id: int, db: Session):
        """Delete a review by ID for admin moderation."""
        review = db.query(ServiceReview).filter(ServiceReview.id == review_id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        db.delete(review)
        db.commit()
        return {"message": "Review deleted successfully"}
