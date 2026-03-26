import { useNavigate } from "react-router-dom";

function Home() {
  // Render the public landing page with auth navigation.
  const navigate = useNavigate();

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h1 className="display-4 fw-bold mb-4">Welcome to Time Bank</h1>
            <p className="lead mb-5">
              Manage your time efficiently and collaboratively
            </p>

            <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
              <button
                className="btn btn-primary btn-lg px-4 gap-3"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
              <button
                className="btn btn-outline-secondary btn-lg px-4"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;