from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import StripePayment, Transaction, User
from ..settings import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL


def _get_stripe():
    """Import and configure stripe lazily so the app starts even without a key."""
    try:
        import stripe as _stripe
        _stripe.api_key = STRIPE_SECRET_KEY
        return _stripe
    except ImportError:
        raise HTTPException(status_code=500, detail="Stripe library not installed. Run: pip install stripe")


class PaymentController:
    # Price in euro cents per credit (1 credit = €1.00)
    CENTS_PER_CREDIT = 100

    @staticmethod
    def create_checkout_session(credits: int, current_user: User, db: Session):
        """Create a Stripe Checkout Session and persist a pending payment record."""
        if not STRIPE_SECRET_KEY or STRIPE_SECRET_KEY.startswith("sk_test_PLACEHOLDER"):
            raise HTTPException(
                status_code=503,
                detail="Stripe is not configured. Set STRIPE_SECRET_KEY in backend/.env"
            )

        stripe = _get_stripe()
        unit_amount = PaymentController.CENTS_PER_CREDIT

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": "Time Bank Credits",
                            "description": f"{credits} time credit{'s' if credits != 1 else ''}",
                        },
                        "unit_amount": unit_amount,
                    },
                    "quantity": credits,
                }],
                mode="payment",
                success_url=f"{FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{FRONTEND_URL}/payment-cancel",
                metadata={
                    "user_email": current_user.email,
                    "credits": str(credits),
                },
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")

        payment = StripePayment(
            stripe_session_id=session.id,
            user_email=current_user.email,
            credits=credits,
            amount_eur_cents=unit_amount * credits,
            status="pending",
        )
        db.add(payment)
        db.commit()

        return {"checkout_url": session.url}

    @staticmethod
    def handle_webhook(payload: bytes, sig_header: str, db: Session):
        """Verify Stripe signature and process the checkout.session.completed event."""
        if not STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET.startswith("whsec_PLACEHOLDER"):
            raise HTTPException(status_code=503, detail="Stripe webhook secret is not configured.")

        stripe = _get_stripe()

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid webhook payload")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Webhook signature error: {str(e)}")

        if event["type"] == "checkout.session.completed":
            PaymentController._fulfill_order(event["data"]["object"], db)

        return {"status": "ok"}

    @staticmethod
    def _fulfill_order(session_data: dict, db: Session):
        """Add credits to the user and mark the payment completed."""
        session_id = session_data["id"]
        payment = db.query(StripePayment).filter(
            StripePayment.stripe_session_id == session_id
        ).first()

        if not payment or payment.status == "completed":
            return

        user = db.query(User).filter(User.email == payment.user_email).first()
        if not user:
            payment.status = "failed"
            db.commit()
            return

        user.credits += payment.credits
        payment.status = "completed"
        payment.completed_at = datetime.utcnow()

        # Create a transaction record for audit trail
        transaction = Transaction(
            user_email=user.email,
            counterparty_email="stripe@timebank.local",  # System identifier
            amount=payment.credits,
            direction="credit",
            reason="stripe_topup",
            external_transaction_id=payment.stripe_session_id,  # Link to Stripe session for traceability
        )
        db.add(transaction)
        db.commit()

    @staticmethod
    def get_my_payments(current_user: User, db: Session):
        """Return the current user's Stripe payment history."""
        return (
            db.query(StripePayment)
            .filter(StripePayment.user_email == current_user.email)
            .order_by(StripePayment.id.desc())
            .all()
        )

    @staticmethod
    def get_all_payments_admin(db: Session):
        """Return all Stripe payments for admin monitoring."""
        return db.query(StripePayment).order_by(StripePayment.id.desc()).all()
