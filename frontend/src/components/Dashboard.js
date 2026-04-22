import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserController from "../controllers/userController";
import AuthController from "../controllers/authController";
import ServiceController from "../controllers/serviceController";

const ITEMS_PER_PAGE = 5;

function Dashboard() {
  // Show authenticated user data and dashboard actions.
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [cancelingRequestId, setCancelingRequestId] = useState(null);
  const [serviceForm, setServiceForm] = useState({ title: "", cost: "" });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [requestsPage, setRequestsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
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

        try {
          const txData = await UserController.getMyTransactions();
          setTransactions(txData);
        } catch (err) {
          setError(err);
        }

        try {
          const requestData = await ServiceController.getIncomingRequests();
          setIncomingRequests(requestData);
        } catch (err) {
          setRequestError(err);
        }

        try {
          const outgoingData = await ServiceController.getOutgoingRequests();
          setOutgoingRequests(outgoingData);
        } catch (err) {
          setRequestError(err);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
        setRequestsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Keep incoming requests current while the dashboard is open.
    const intervalId = setInterval(() => {
      refreshIncomingRequests();
      refreshOutgoingRequests();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const refreshIncomingRequests = async () => {
    try {
      const requestData = await ServiceController.getIncomingRequests();
      setIncomingRequests(requestData);
    } catch (err) {
      setRequestError(err);
    }
  };

  const refreshOutgoingRequests = async () => {
    try {
      const outgoingData = await ServiceController.getOutgoingRequests();
      setOutgoingRequests(outgoingData);
    } catch (err) {
      setRequestError(err);
    }
  };

  const refreshTransactions = async () => {
    try {
      const txData = await UserController.getMyTransactions();
      setTransactions(txData);
    } catch (err) {
      setError(err);
    }
  };

  const handleLogout = () => {
    // Clear session data and return to the home page.
    AuthController.logout();
    navigate("/");
  };

  const goToAdmin = () => {
    // Navigate admins to the admin panel.
    navigate("/admin");
  };

  const goToServices = () => {
    // Navigate users to the browse-services page.
    navigate("/browse-services");
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

  const handleAcceptRequest = async (requestId) => {
    setRequestError("");
    setRequestMessage("");

    try {
      // Accept only changes request state to accepted.
      await ServiceController.acceptRequest(requestId);
      await refreshIncomingRequests();
      await refreshOutgoingRequests();
      setRequestMessage("Request accepted. Complete it when the service is finished.");
    } catch (err) {
      setRequestError(err);
      await refreshIncomingRequests();
      await refreshOutgoingRequests();
      try {
        const userData = await UserController.getProfile();
        setUser(userData);
      } catch (profileErr) {
        setError(profileErr);
      }
    }
  };

  const handleCompleteRequest = async (requestId) => {
    setRequestError("");
    setRequestMessage("");

    try {
      await ServiceController.completeRequest(requestId);
      const userData = await UserController.getProfile();
      setUser(userData);
      await refreshIncomingRequests();
      await refreshOutgoingRequests();
      await refreshTransactions();
      setRequestMessage("Request completed and credits transferred.");
    } catch (err) {
      setRequestError(err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setRequestError("");
    setRequestMessage("");

    try {
      await ServiceController.rejectRequest(requestId);
      await refreshIncomingRequests();
      await refreshOutgoingRequests();
      setRequestMessage("Request rejected.");
    } catch (err) {
      setRequestError(err);
    }
  };

  const handleCancelPendingRequest = async (requestId) => {
    setRequestError("");
    setRequestMessage("");
    setCancelingRequestId(requestId);

    try {
      await ServiceController.cancelRequest(requestId);
      await refreshIncomingRequests();
      await refreshOutgoingRequests();
      setRequestMessage("Request cancelled.");
    } catch (err) {
      setRequestError(err);
    } finally {
      setCancelingRequestId(null);
    }
  };

  const getServiceTitle = (serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    return service ? service.title : `Service #${serviceId}`;
  };

  const getDisplayStatus = (status) => {
    // UI label requested as pending for user-friendly wording.
    if (status === "requested") {
      return "pending";
    }
    return status;
  };

  const getTransactionSign = (direction) => (direction === "credit" ? "+" : "-");

  const getTransactionBadgeClass = (direction) =>
    direction === "credit" ? "bg-success" : "bg-danger";

  const pendingHistoryRows = [
    ...outgoingRequests
      .filter((request) => request.status === "requested" || request.status === "accepted")
      .map((request) => ({
        key: `pending-out-${request.id}`,
        type: "pending",
        request_id: request.id,
        canCancel: true,
        direction: "debit",
        amount: request.cost,
        counterparty_email: request.provider_email,
        service_id: request.service_id,
        created_at: request.created_at,
      })),
    ...incomingRequests
      .filter((request) => request.status === "requested" || request.status === "accepted")
      .map((request) => ({
        key: `pending-in-${request.id}`,
        type: "pending",
        request_id: request.id,
        canCancel: false,
        direction: "credit",
        amount: request.cost,
        counterparty_email: request.requester_email,
        service_id: request.service_id,
        created_at: request.created_at,
      })),
  ];

  const completedHistoryRows = transactions.map((tx) => ({
    key: `tx-${tx.id}`,
    type: "completed",
    direction: tx.direction,
    amount: tx.amount,
    counterparty_email: tx.counterparty_email,
    service_id: tx.service_id,
    created_at: tx.created_at,
    reason: tx.reason,
  }));

  const historyRows = [...pendingHistoryRows, ...completedHistoryRows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const requestsTotalPages = Math.max(1, Math.ceil(incomingRequests.length / ITEMS_PER_PAGE));
  const historyTotalPages = Math.max(1, Math.ceil(historyRows.length / ITEMS_PER_PAGE));

  const paginatedIncomingRequests = incomingRequests.slice(
    (requestsPage - 1) * ITEMS_PER_PAGE,
    requestsPage * ITEMS_PER_PAGE
  );

  const paginatedHistoryRows = historyRows.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (requestsPage > requestsTotalPages) {
      setRequestsPage(requestsTotalPages);
    }
  }, [requestsPage, requestsTotalPages]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

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
            <button className="btn tb-btn-browse me-2" onClick={goToServices}>
              Browse services
            </button>
            {user.role === "admin" && (
              <button className="btn tb-btn-admin me-2" onClick={goToAdmin}>
                Admin panel
              </button>
            )}
            <button className="btn tb-btn-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row g-4">
          <div className="col-12 col-lg-6 order-3 order-lg-3">
            <div className="card shadow-lg h-100">
              <div className="card-body">
                <h2 className="card-title mb-4">Requests for My Services</h2>

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

                {requestsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <p className="text-muted mb-0">No requests yet.</p>
                ) : (
                  <div className="list-group">
                    {paginatedIncomingRequests.map((request) => (
                      <div key={request.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                          <div>
                            <div className="fw-bold">{getServiceTitle(request.service_id)}</div>
                            <div className="small text-muted">Requested by: {request.requester_email}</div>
                            <div className="small text-muted">Cost: {request.cost} credits</div>
                            <div className="small">
                              Status: <span className="badge bg-secondary text-uppercase">{getDisplayStatus(request.status)}</span>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-success btn-sm tb-btn-accept"
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={request.status !== "requested"}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm tb-btn-complete"
                              onClick={() => handleCompleteRequest(request.id)}
                              disabled={request.status !== "accepted"}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={request.status !== "requested"}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!requestsLoading && incomingRequests.length > ITEMS_PER_PAGE && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setRequestsPage((prev) => Math.max(1, prev - 1))}
                      disabled={requestsPage === 1}
                    >
                      Previous
                    </button>
                    <span className="small text-muted">
                      Page {requestsPage} of {requestsTotalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setRequestsPage((prev) => Math.min(requestsTotalPages, prev + 1))}
                      disabled={requestsPage === requestsTotalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6 order-4 order-lg-4">
            <div className="card shadow-lg h-100">
              <div className="card-body">
                <h2 className="card-title mb-4">Transaction History</h2>

                {historyRows.length === 0 ? (
                  <p className="text-muted mb-0">No transactions yet.</p>
                ) : (
                  <div className="list-group">
                    {paginatedHistoryRows.map((row) => (
                      <div key={row.key} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                          <div>
                            <div className="fw-bold">
                              {row.type === "pending"
                                ? "Pending service request"
                                : row.reason === "service_payment"
                                  ? "Service payment"
                                  : row.reason}
                            </div>
                            <div className="small text-muted">With: {row.counterparty_email}</div>
                            <div className="small text-muted">Service ID: {row.service_id}</div>
                            <div className="small text-muted">{new Date(row.created_at).toLocaleString()}</div>
                          </div>

                          <span
                            className={`badge ${row.type === "pending" ? "bg-warning text-dark" : getTransactionBadgeClass(row.direction)} fs-6`}
                          >
                            {getTransactionSign(row.direction)}{row.amount} credits
                            {row.type === "pending" ? " (pending)" : ""}
                          </span>

                          {row.type === "pending" && row.canCancel && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleCancelPendingRequest(row.request_id)}
                              disabled={cancelingRequestId === row.request_id}
                            >
                              {cancelingRequestId === row.request_id ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {historyRows.length > ITEMS_PER_PAGE && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                    >
                      Previous
                    </button>
                    <span className="small text-muted">
                      Page {historyPage} of {historyTotalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                      disabled={historyPage === historyTotalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6 order-1 order-lg-1">
            <div className="card shadow-lg h-100">
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
          </div>

          <div className="col-12 col-lg-6 order-2 order-lg-2">
            <div className="card shadow-lg h-100">
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