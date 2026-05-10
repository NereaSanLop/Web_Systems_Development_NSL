import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentController from "../controllers/paymentController";

function BuyCredits() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const creditPackages = [
    { credits: 5, price: 5 },
    { credits: 10, price: 10 },
    { credits: 20, price: 20 },
    { credits: 50, price: 50 },
  ];

  const handleBuy = async (credits) => {
    setLoading(true);
    try {
      const result = await PaymentController.createCheckoutSession(credits);
      window.location.href = result.checkout_url;
    } catch (err) {
      alert(`Error: ${err}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Time Bank - Buy Credits</span>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mt-5">
        <h2 className="mb-4">Buy Time Credits</h2>
        <p className="text-muted mb-5">1 credit = €1.00</p>

        <div className="row g-4">
          {creditPackages.map((pkg) => (
            <div key={pkg.credits} className="col-12 col-sm-6 col-md-3">
              <div className="card shadow-lg h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">{pkg.credits} Credits</h5>
                  <p className="card-text fs-4 fw-bold text-success">€{pkg.price}.00</p>
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => handleBuy(pkg.credits)}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BuyCredits;
