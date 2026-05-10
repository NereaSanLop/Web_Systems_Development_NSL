from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_admin_user, get_current_user
from ..models import User
from ..schemas import PaymentCreate, PaymentResponse
from ..controllers.payment_controller import PaymentController

router = APIRouter()


@router.post("/payments/create-checkout-session", response_model=PaymentResponse)
def create_checkout_session(
    payload: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout Session to purchase time credits."""
    return PaymentController.create_checkout_session(payload.credits, current_user, db)


@router.post("/payments/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive and process Stripe webhook events (no auth required)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    return PaymentController.handle_webhook(payload, sig_header, db)


@router.get("/payments/my")
def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's Stripe payment history."""
    return PaymentController.get_my_payments(current_user, db)


@router.get("/admin/payments")
def get_all_payments_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Return all Stripe payments for admin monitoring."""
    return PaymentController.get_all_payments_admin(db)
