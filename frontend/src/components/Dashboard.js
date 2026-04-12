import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserController from "../controllers/userController";
import AuthController from "../controllers/authController";
import ServiceController from "../controllers/serviceController";

function Dashboard() {
  // Show authenticated user data and dashboard actions.
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [serviceForm, setServiceForm] = useState({ title: "", cost: "" });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // Load the current user's profile information.
      try {
        const [userData, userServices] = await Promise.all([
          UserController.getProfile(),
          ServiceController.getMyServices(),
        ]);
        setUser(userData);
        setServices(userServices);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    // Clear session data and return to the home page.
    AuthController.logout();
    navigate("/");
  };

  const goToAdmin = () => {
    // Navigate admins to the admin panel.
    navigate("/admin");
  };

  const resetServiceForm = () => {
    setServiceForm({ title: "", cost: "" });
    setEditingServiceId(null);
  };

  const handleServiceInputChange = (event) => {
    const { name, value } = event.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdateService = async (event) => {
    event.preventDefault();
    setServiceError("");

    const trimmedTitle = serviceForm.title.trim();
    const parsedCost = Number(serviceForm.cost);

    if (!trimmedTitle || !Number.isInteger(parsedCost) || parsedCost <= 0) {
      setServiceError("Please enter a valid title and a positive integer cost.");
      return;
    }

    try {
      const payload = { title: trimmedTitle, cost: parsedCost };

      if (editingServiceId) {
        const updatedService = await ServiceController.updateService(editingServiceId, payload);
        setServices((prev) =>
          prev.map((service) => (service.id === editingServiceId ? updatedService : service))
        );
      } else {
        const newService = await ServiceController.createService(payload);
        setServices((prev) => [newService, ...prev]);
      }

      resetServiceForm();
    } catch (err) {
      setServiceError(err);
    }
  };

  const handleEditService = (service) => {
    setServiceError("");
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      cost: String(service.cost),
    });
  };

  const handleDeleteService = async (serviceId) => {
    setServiceError("");
    try {
      await ServiceController.deleteService(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      if (editingServiceId === serviceId) {
        resetServiceForm();
      }
    } catch (err) {
      setServiceError(err);
    }
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
            <div className="card shadow-lg mb-4">
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

                <div className="mb-0">
                  <label className="form-label fw-bold">Credits:</label>
                  <p className="form-control-plaintext">{user.credits}</p>
                </div>
              </div>
            </div>

            <div className="card shadow-lg">
              <div className="card-body">
                <h2 className="card-title mb-4">My Services</h2>

                <form onSubmit={handleCreateOrUpdateService} className="mb-4">
                  <div className="mb-3">
                    <label htmlFor="service-title" className="form-label fw-bold">Title</label>
                    <input
                      id="service-title"
                      name="title"
                      className="form-control"
                      value={serviceForm.title}
                      onChange={handleServiceInputChange}
                      placeholder="Example: 1 hour of Spanish tutoring"
                      maxLength={120}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="service-cost" className="form-label fw-bold">Cost (credits)</label>
                    <input
                      id="service-cost"
                      name="cost"
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      value={serviceForm.cost}
                      onChange={handleServiceInputChange}
                      placeholder="Example: 3"
                      required
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingServiceId ? "Save changes" : "Create service"}
                    </button>
                    {editingServiceId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetServiceForm}
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>

                {serviceError && (
                  <div className="alert alert-danger" role="alert">
                    {serviceError}
                  </div>
                )}

                {services.length === 0 ? (
                  <p className="text-muted mb-0">No services yet. Create your first one.</p>
                ) : (
                  <ul className="list-group">
                    {services.map((service) => (
                      <li key={service.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{service.title}</div>
                          <small className="text-muted">{service.cost} credits</small>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditService(service)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;