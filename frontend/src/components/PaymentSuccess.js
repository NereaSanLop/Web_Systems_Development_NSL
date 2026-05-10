import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row">
          <div className="col-md-6 mx-auto">
            <div className="card shadow-lg">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                </div>
                <h2 className="card-title mb-3">Payment Successful!</h2>
                <p className="text-muted mb-3">
                  Your credits have been added to your account.
                </p>
                {sessionId && (
                  <p className="text-muted small mb-4">
                    Session: <code>{sessionId.slice(0, 20)}...</code>
                  </p>
                )}
                <p className="text-muted small mb-4">
                  Redirecting to dashboard in 5 seconds...
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
