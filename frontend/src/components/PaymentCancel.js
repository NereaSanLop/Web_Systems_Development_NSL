import { useNavigate } from "react-router-dom";

function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row">
          <div className="col-md-6 mx-auto">
            <div className="card shadow-lg">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-times-circle text-warning" style={{ fontSize: "4rem" }}></i>
                </div>
                <h2 className="card-title mb-3">Payment Cancelled</h2>
                <p className="text-muted mb-4">
                  Your payment has been cancelled. Your account was not charged.
                </p>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/buy-credits")}
                  >
                    Try Again
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancel;
