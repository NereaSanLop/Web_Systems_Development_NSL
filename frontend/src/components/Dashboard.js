import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserController from "../controllers/userController";
import AuthController from "../controllers/authController";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await UserController.getProfile();
        setUser(userData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    AuthController.logout();
    navigate("/");
  };

  const goToAdmin = () => {
    navigate("/admin");
  };

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Time Bank</span>
          <div>
            {user.role === "admin" && (
              <button className="btn btn-outline-warning me-2" onClick={goToAdmin}>
                Admin panel
              </button>
            )}
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg">
              <div className="card-body">
                <h2 className="card-title mb-4">My Profile</h2>

                <div className="mb-3">
                  <label className="form-label fw-bold">Name:</label>
                  <p className="form-control-plaintext">{user.name}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Email:</label>
                  <p className="form-control-plaintext">{user.email}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Role:</label>
                  <p>
                    <span className={`badge bg-${user.role === "admin" ? "danger" : "success"}`}>
                      {user.role}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;