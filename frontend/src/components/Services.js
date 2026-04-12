import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthController from "../controllers/authController";
import ServiceController from "../controllers/serviceController";

function Services() {
  // Display a searchable list of services offered by other users.
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ q: "", minCost: "", maxCost: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const loadServices = async (activeFilters = {}) => {
    // Fetch services using the current filter set.
    setError("");
    try {
      // Load outgoing requests together so cards can render a live Pending state.
      const [servicesData, outgoingData] = await Promise.all([
        ServiceController.browseServices(activeFilters),
        ServiceController.getOutgoingRequests(),
      ]);
      setServices(servicesData);
      setOutgoingRequests(outgoingData);
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

  const handleLogout = () => {
    // Clear session token and return to the home page.
    AuthController.logout();
    navigate("/");
  };

  const openRequestModal = (service) => {
    setSelectedService(service);
    setRequestError("");
    setRequestMessage("");
  };

  const closeRequestModal = () => {
    if (requestLoading) {
      return;
    }

    setSelectedService(null);
    setRequestError("");
    setRequestMessage("");
  };

  const confirmRequest = async () => {
    if (!selectedService) {
      return;
    }

    setRequestLoading(true);
    setRequestError("");
    setRequestMessage("");

    try {
      await ServiceController.requestService(selectedService.id);
      // Refresh after creation to disable Buy immediately for the same service.
      const updatedOutgoing = await ServiceController.getOutgoingRequests();
      setOutgoingRequests(updatedOutgoing);
      setRequestMessage(`Request sent for "${selectedService.title}". It is now pending.`);
      setSelectedService(null);
    } catch (err) {
      setRequestError(err);
    } finally {
      setRequestLoading(false);
    }
  };

  const getOpenRequestForService = (serviceId) =>
    // Treat requested/accepted as open so the user cannot create duplicate buys.
    outgoingRequests.find(
      (request) =>
        request.service_id === serviceId &&
        (request.status === "requested" || request.status === "accepted")
    );

  const getStatusLabel = (status) => {
    if (status === "requested") {
      return "pending";
    }
    return status;
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
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Log out
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

        {requestMessage && (
          <div className="alert alert-success" role="alert">
            {requestMessage}
          </div>
        )}

        {requestError && (
          <div className="alert alert-danger" role="alert">
            {requestError}
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
              (() => {
                const openRequest = getOpenRequestForService(service.id);
                return (
              <div key={service.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h3 className="h5 card-title">{service.title}</h3>
                    <p className="card-text text-muted mb-2">{service.cost} credits</p>
                    <p className="card-text small mb-0">
                      Offered by: <strong>{service.owner_email}</strong>
                    </p>
                    <div className="mt-3">
                      {openRequest && (
                        <p className="small mb-2">
                          Status: <span className="badge bg-warning text-dark text-uppercase">{getStatusLabel(openRequest.status)}</span>
                        </p>
                      )}
                      <button
                        type="button"
                        className={`btn w-100 ${openRequest ? "btn-outline-secondary" : "btn-primary"}`}
                        onClick={() => openRequestModal(service)}
                        disabled={Boolean(openRequest)}
                      >
                        {openRequest ? "Pending" : "Buy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}
      </div>

      {selectedService && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          role="dialog"
          aria-modal="true"
          // Single overlay layer keeps the dialog buttons clickable.
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 2000 }}
        >
          <div className="card shadow w-100" style={{ maxWidth: "520px" }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Are you sure?</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeRequestModal} />
              </div>

              <p className="mb-2">
                Send a pending request for <strong>{selectedService.title}</strong>?
              </p>
              <p className="mb-4 text-muted">
                This request will wait for the owner to accept it.
              </p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeRequestModal}
                  disabled={requestLoading}
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmRequest}
                  disabled={requestLoading}
                >
                  {requestLoading ? "Sending..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;
