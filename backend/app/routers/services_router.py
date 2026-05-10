from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_admin_user, get_current_user
from ..models import User
from ..schemas import (
    ReviewCreate, ReviewResponse, ServiceCreate, ServiceRequestResponse,
    ServiceUpdate, ServiceResponse
)
from ..controllers.service_controller import ServiceController

router = APIRouter()


@router.get("/services/browse", response_model=list[ServiceResponse])
def browse_services(
    q: str | None = Query(default=None, max_length=120),
    min_cost: int | None = Query(default=None, ge=1),
    max_cost: int | None = Query(default=None, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Browse services offered by other users with simple filters."""
    if min_cost is not None and max_cost is not None and min_cost > max_cost:
        raise HTTPException(status_code=400, detail="min_cost cannot be greater than max_cost")

    return ServiceController.browse_services(
        current_user=current_user,
        db=db,
        query=q,
        min_cost=min_cost,
        max_cost=max_cost,
    )


@router.get("/services", response_model=list[ServiceResponse])
def list_my_services(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all services created by the authenticated user."""
    return ServiceController.list_my_services(current_user, db)


@router.post("/services", response_model=ServiceResponse)
def create_service(
    payload: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a service linked to the authenticated user email."""
    return ServiceController.create_service(payload.title, payload.cost, current_user, db)


@router.put("/services/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a service that belongs to the authenticated user."""
    return ServiceController.update_service(service_id, payload.title, payload.cost, current_user, db)


@router.delete("/services/{service_id}")
def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a service that belongs to the authenticated user."""
    return ServiceController.delete_service(service_id, current_user, db)


@router.get("/admin/services", response_model=list[ServiceResponse])
def list_all_services_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Return all services for admin management."""
    return ServiceController.list_all_services(db)


@router.get("/admin/service-requests", response_model=list[ServiceRequestResponse])
def list_all_service_requests_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Return all service requests for admin monitoring."""
    return ServiceController.list_all_requests_admin(db)


@router.delete("/admin/services/{service_id}")
def delete_service_admin(
    service_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Delete any service by ID for admin management."""
    return ServiceController.admin_delete_service(service_id, db)


@router.put("/admin/services/{service_id}/toggle-visibility")
def toggle_service_visibility(
    service_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Toggle a service's visibility for admin moderation."""
    return ServiceController.admin_toggle_visibility(service_id, db)


@router.post("/services/{service_id}/requests", response_model=ServiceRequestResponse)
def request_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a request for a service offered by another user."""
    return ServiceController.request_service(service_id, current_user, db)


@router.get("/service-requests/incoming", response_model=list[ServiceRequestResponse])
def list_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return requests received by the authenticated provider."""
    return ServiceController.list_incoming_requests(current_user, db)


@router.get("/service-requests/outgoing", response_model=list[ServiceRequestResponse])
def list_outgoing_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return requests created by the authenticated requester."""
    return ServiceController.list_outgoing_requests(current_user, db)


@router.post("/service-requests/{request_id}/accept", response_model=ServiceRequestResponse)
def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a pending request as the service provider."""
    return ServiceController.accept_request(request_id, current_user, db)


@router.post("/service-requests/{request_id}/reject", response_model=ServiceRequestResponse)
def reject_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a pending request as the service provider."""
    return ServiceController.reject_request(request_id, current_user, db)


@router.post("/service-requests/{request_id}/cancel", response_model=ServiceRequestResponse)
def cancel_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a request as the requester or provider before completion."""
    return ServiceController.cancel_request(request_id, current_user, db)


@router.post("/service-requests/{request_id}/complete", response_model=ServiceRequestResponse)
def complete_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete an accepted request and transfer credits safely."""
    return ServiceController.complete_request(request_id, current_user, db)


# ── Reviews ──────────────────────────────────────────────────────────────────

@router.post("/service-requests/{request_id}/review", response_model=ReviewResponse)
def create_review(
    request_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a rating and review for a completed service request."""
    return ServiceController.create_review(
        request_id, payload.rating, payload.comment, current_user, db
    )


@router.get("/services/{service_id}/reviews", response_model=list[ReviewResponse])
def get_service_reviews(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all reviews for a specific service."""
    return ServiceController.get_reviews_for_service(service_id, db)


@router.get("/reviews/mine", response_model=list[ReviewResponse])
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return reviews submitted by the current user."""
    return ServiceController.get_my_reviews(current_user, db)


@router.get("/admin/reviews", response_model=list[ReviewResponse])
def get_all_reviews_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Return all reviews for admin moderation."""
    return ServiceController.get_all_reviews_admin(db)


@router.delete("/admin/reviews/{review_id}")
def delete_review_admin(
    review_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Delete a review for admin moderation."""
    return ServiceController.delete_review_admin(review_id, db)
