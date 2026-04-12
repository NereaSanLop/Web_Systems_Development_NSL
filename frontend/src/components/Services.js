import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ServiceController from "../controllers/serviceController";

function Services() {
  // Display a searchable list of services offered by other users.
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ q: "", minCost: "", maxCost: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadServices = async (activeFilters = {}) => {
    // Fetch services using the current filter set.
    setError("");
    try {
      const data = await ServiceController.browseServices(activeFilters);
      setServices(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial data when the page is first rendered.
    loadServices();
  }, []);

  const handleFilterChange = (event) => {
    // Keep filter form state in sync with user input.
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (event) => {
    // Apply filters and refresh results.
    event.preventDefault();
    setLoading(true);
    await loadServices(filters);
  };

  const clearFilters = async () => {
    // Reset filters and reload the full browse list.
    const reset = { q: "", minCost: "", maxCost: "" };
    setFilters(reset);
    setLoading(true);
    await loadServices(reset);
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Time Bank</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-info" onClick={() => navigate("/dashboard")}>
              My dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="card-title h4 mb-3">Browse Services</h2>
            <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
              <div className="col-md-5">
                <label htmlFor="q" className="form-label">Keyword</label>
                <input
                  id="q"
                  name="q"
                  className="form-control"
                  value={filters.q}
                  onChange={handleFilterChange}
                  placeholder="Example: tutoring"
                  maxLength={120}
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="minCost" className="form-label">Min cost</label>
                <input
                  id="minCost"
                  name="minCost"
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  value={filters.minCost}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="maxCost" className="form-label">Max cost</label>
                <input
                  id="maxCost"
                  name="maxCost"
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  value={filters.maxCost}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-md-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary w-100">Apply</button>
                <button type="button" className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No services found with the selected filters.
          </div>
        ) : (
          <div className="row g-3">
            {services.map((service) => (
              <div key={service.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h3 className="h5 card-title">{service.title}</h3>
                    <p className="card-text text-muted mb-2">{service.cost} credits</p>
                    <p className="card-text small mb-0">
                      Offered by: <strong>{service.owner_email}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Services;
