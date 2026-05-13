import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserController from "../controllers/userController";
import AuthController from "../controllers/authController";
import ServiceController from "../controllers/serviceController";

const ITEMS_PER_PAGE = 5;

/**
 * Display an interactive or read-only star rating component for service reviews.
 */
const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <span>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: readOnly ? "default" : "pointer",
            fontSize: "1.4rem",
            color: star <= (hovered || value) ? "#ffc107" : "#dee2e6",
          }}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
        >
          ★
        </span>
      ))}
    </span>
  );
};

/**
 * Modal dialog for submitting reviews of completed service requests.
 */
function ReviewModal({ request, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(request.id, rating, comment || null);
      onClose();
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Leave a Review</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="text-muted mb-3">
                Service request #{request.id} with <strong>{request.provider_email}</strong>
              </p>
              <div className="mb-3">
                <label className="form-label fw-bold">Rating</label>
                <div>
                  <StarRating value={rating} onChange={setRating} />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="review-comment" className="form-label fw-bold">
                  Comment <span className="text-muted fw-normal">(optional)</span>
                </label>
                <textarea
                  id="review-comment"
                  className="form-control"
                  rows={3}
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience…"
                />
              </div>
              {error && <div className="alert alert-danger py-2">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  // Show authenticated user data and dashboard actions.
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
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
  const [reviewModalRequest, setReviewModalRequest] = useState(null);
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

        try {
          const reviewsData = await ServiceController.getMyReviews();
          setMyReviews(reviewsData);
        } catch {
          // reviews are non-critical
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
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Fetch and update the list of incoming service requests for the current provider.
   */
  const refreshIncomingRequests = async () => {
    try {
      const requestData = await ServiceController.getIncomingRequests();
      setIncomingRequests(requestData);
    } catch (err) {
      setRequestError(err);
    }
  };

  /**
   * Fetch and update the list of outgoing service requests made by the current requester.
   */
  const refreshOutgoingRequests = async () => {
    try {
      const outgoingData = await ServiceController.getOutgoingRequests();
      setOutgoingRequests(outgoingData);
    } catch (err) {
      setRequestError(err);
    }
  };

  /**
   * Fetch and update the transaction history for the authenticated user.
   */
  const refreshTransactions = async () => {
    try {
      const txData = await UserController.getMyTransactions();
      setTransactions(txData);
    } catch (err) {
      setError(err);
    }
  };

  /**
   * Fetch and update the list of reviews submitted by the current user.
   */
  const refreshMyReviews = async () => {
    try {
      const reviewsData = await ServiceController.getMyReviews();
      setMyReviews(reviewsData);
    } catch {
      // non-critical
    }
  };

  const handleLogout = () => {
    // Clear session data and return to the home page.
    AuthController.logout();
    navigate("/");
  };

  /**
   * Navigate admin users to the admin panel.
   */
  const goToAdmin = () => {
    navigate("/admin");
  };

  /**
   * Navigate users to the browse services page.
   */
  const goToServices = () => {
    navigate("/browse-services");
  };

  /**
   * Navigate users to the buy credits page.
   */
  const goToBuyCredits = () => navigate("/buy-credits");

  /**
   * Clear the service form fields and exit edit mode.
   */
  const resetServiceForm = () => {
    setServiceForm({ title: "", cost: "" });
    setEditingServiceId(null);
  };

  /**
   * Update the service form state with the new input value.
   */
  const handleServiceInputChange = (event) => {
    const { name, value } = event.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Create a new service or update an existing one depending on the editing state.
   */
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

  /**
   * Set the service form to edit mode with the selected service's data.
   */
  const handleEditService = (service) => {
    setServiceError("");
    setEditingServiceId(service.id);
    setServiceForm({ title: service.title, cost: String(service.cost) });
  };

  /**
   * Delete a service and reset the form if it was being edited.
   */
  const handleDeleteService = async (serviceId) => {
    setServiceError("");
    try {
      await ServiceController.deleteService(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      if (editingServiceId === serviceId) resetServiceForm();
    } catch (err) {
      setServiceError(err);
    }
  };

  /**
   * Accept an incoming service request, marking it as accepted without completing the service.
   */
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
      } catch {
        // ignore
      }
    }
  };

  /**
   * Complete an accepted request, transferring credits from requester to provider.
   */
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

  /**
   * Reject a pending service request without accepting it.
   */
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

  /**
   * Cancel an open service request as either requester or provider.
   */
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

  /**
   * Submit a review for a completed service request and refresh the reviews list.
   */
  const handleSubmitReview = async (requestId, rating, comment) => {
    await ServiceController.createReview(requestId, rating, comment);
    await refreshMyReviews();
  };

  const reviewedRequestIds = new Set(myReviews.map((r) => r.service_request_id));

  const completedOutgoing = outgoingRequests.filter(
    (request) => request.status === "completed" && !reviewedRequestIds.has(request.id)
  );

  /**
   * Retrieve the title of a service by its ID, or return a fallback identifier.
   */
  const getServiceTitle = (serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    return service ? service.title : `Service #${serviceId}`;
  };

  /**
   * Convert request status to a user-friendly label, showing 'pending' instead of 'requested'.
   */
  const getDisplayStatus = (status) => {
    return status === "requested" ? "pending" : status;
  };

  /**
   * Return the appropriate sign ('+' or '-') for displaying transaction amounts.
   */
  const getTransactionSign = (direction) => (direction === "credit" ? "+" : "-");

  /**
   * Return the Bootstrap badge class color based on transaction direction (credit or debit).
   */
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
    if (requestsPage > requestsTotalPages) setRequestsPage(requestsTotalPages);
  }, [requestsPage, requestsTotalPages]);

  useEffect(() => {
    if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages);
  }, [historyPage, historyTotalPages]);

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {reviewModalRequest && (
        <ReviewModal
          request={reviewModalRequest}
          onClose={() => setReviewModalRequest(null)}
          onSubmit={handleSubmitReview}
        />
      )}

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

          {/* ── Profile ───────────────────────────────────────────────── */}
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
                <div className="mb-3">
                  <label className="form-label fw-bold">Credits:</label>
                  <p className="form-control-plaintext fs-5 fw-semibold">{user.credits}</p>
                </div>
                <button className="btn btn-success" onClick={goToBuyCredits}>
                  Buy Credits
                </button>
              </div>
            </div>
          </div>

          {/* ── My Services ───────────────────────────────────────────── */}
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
                      <button type="button" className="btn btn-outline-secondary" onClick={resetServiceForm}>
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>

                {serviceError && (
                  <div className="alert alert-danger" role="alert">{serviceError}</div>
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
                          {!service.is_visible && (
                            <span className="badge bg-secondary ms-2">Hidden by admin</span>
                          )}
                          {service.avg_rating != null && (
                            <span className="ms-2 text-warning small">
                              {"★".repeat(Math.round(service.avg_rating))}{"☆".repeat(5 - Math.round(service.avg_rating))}
                              <span className="text-muted"> ({service.review_count})</span>
                            </span>
                          )}
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

          {/* ── Incoming Requests ─────────────────────────────────────── */}
          <div className="col-12 col-lg-6 order-3 order-lg-3">
            <div className="card shadow-lg h-100">
              <div className="card-body">
                <h2 className="card-title mb-4">Requests for My Services</h2>

                {requestMessage && (
                  <div className="alert alert-success" role="alert">{requestMessage}</div>
                )}

                {requestError && (
                  <div className="alert alert-danger" role="alert">{requestError}</div>
                )}

                {requestsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading…</span>
                    </div>
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <p className="text-muted mb-0">No requests yet.</p>
                ) : (
                  <>
                    <div className="list-group mb-3">
                      {paginatedIncomingRequests.map((request) => (
                        <div key={request.id} className="list-group-item">
                          <div className="d-flex w-100 justify-content-between">
                            <div>
                              <div className="fw-bold">{getServiceTitle(request.service_id)}</div>
                            </div>
                          </div>
                          <div className="small text-muted">Requested by: {request.requester_email}</div>
                          <div className="small text-muted">Cost: {request.cost} credits</div>
                          <div className="small">
                            Status:{" "}
                            <span className="badge bg-secondary text-uppercase">
                              {getDisplayStatus(request.status)}
                            </span>
                          </div>

                          <div className="d-flex gap-2">
                            {request.status === "requested" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success mt-2"
                                  onClick={() => handleAcceptRequest(request.id)}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger mt-2"
                                  onClick={() => handleRejectRequest(request.id)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {request.status === "accepted" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary mt-2"
                                onClick={() => handleCompleteRequest(request.id)}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <nav aria-label="Requests pagination">
                      <ul className="pagination justify-content-center mb-0">
                        {Array.from({ length: requestsTotalPages }, (_, i) => i + 1).map((page) => (
                          <li key={page} className={`page-item ${requestsPage === page ? "active" : ""}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setRequestsPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Transaction History ───────────────────────────────────── */}
          <div className="col-12 col-lg-6 order-4 order-lg-4">
            <div className="card shadow-lg h-100">
              <div className="card-body">
                <h2 className="card-title mb-4">Transaction History</h2>

                {historyRows.length === 0 ? (
                  <p className="text-muted mb-0">No transactions yet.</p>
                ) : (
                  <>
                    <div className="list-group mb-3">
                      {paginatedHistoryRows.map((row) => (
                        <div key={row.key} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">
                              {row.type === "pending"
                                ? "Pending service request"
                                : row.reason === "stripe_topup"
                                  ? "Credits purchased (Stripe)"
                                  : row.reason === "service_payment"
                                    ? "Service payment"
                                    : row.reason}
                            </div>
                            <div className="small text-muted">With: {row.counterparty_email}</div>
                            {row.service_id && (
                              <div className="small text-muted">Service ID: {row.service_id}</div>
                            )}
                            <div className="small text-muted">
                              {new Date(row.created_at).toLocaleString()}
                            </div>
                          </div>

                          <span
                            className={`badge ${getTransactionBadgeClass(row.direction)} fs-6`}
                          >
                            {getTransactionSign(row.direction)}{row.amount}
                          </span>

                          {row.type === "pending" && row.canCancel && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-2"
                              onClick={() => handleCancelPendingRequest(row.request_id)}
                              disabled={cancelingRequestId === row.request_id}
                            >
                              {cancelingRequestId === row.request_id ? "Cancelling…" : "Cancel"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <nav aria-label="History pagination">
                      <ul className="pagination justify-content-center mb-0">
                        {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((page) => (
                          <li key={page} className={`page-item ${historyPage === page ? "active" : ""}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setHistoryPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Pending Reviews ───────────────────────────────────────── */}
          {completedOutgoing.length > 0 && (
            <div className="col-12 order-5">
              <div className="card shadow-lg border-warning">
                <div className="card-body">
                  <h2 className="card-title mb-3">
                    Pending Reviews
                    <span className="badge bg-warning text-dark ms-2">{completedOutgoing.length}</span>
                  </h2>
                  <p className="text-muted small mb-3">
                    These services you used have not been reviewed yet.
                  </p>
                  <div className="list-group">
                    {completedOutgoing.map((request) => (
                      <div key={request.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{getServiceTitle(request.service_id)}</div>
                          <div className="small text-muted">Provider: {request.provider_email}</div>
                          <div className="small text-muted">{request.cost} credits · completed</div>
                        </div>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => setReviewModalRequest(request)}
                        >
                          Leave Review
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
