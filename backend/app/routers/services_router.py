from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import ServiceCreate, ServiceUpdate, ServiceResponse
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
