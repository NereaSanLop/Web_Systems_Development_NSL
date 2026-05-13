import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserController from "../controllers/userController";
import AuthController from "../controllers/authController";
import ServiceController from "../controllers/serviceController";
import PaymentController from "../controllers/paymentController";

const TABS = ["users", "services", "requests", "transactions", "reviews", "payments"];

/**
 * Display a visual star rating representation using filled and empty stars.
 */
const StarDisplay = ({ rating }) => (
  <span className="text-warning">
    {"★".repeat(rating)}{"☆".repeat(5 - rating)}
  </span>
);

function Admin() {
  // Render the admin interface for user management tasks.
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  /**
   * Fetch all admin data including users, services, transactions, reviews, payments, and requests.
   */
  const fetchAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [userData, serviceData, txData, reviewData, paymentData, requestData] = await Promise.all([
        UserController.getAllUsers(),
        ServiceController.getAllServicesAdmin(),
        UserController.getAllTransactionsAdmin(),
        ServiceController.getAllReviewsAdmin(),
        PaymentController.getAllPaymentsAdmin().catch(() => []),
        ServiceController.getAllServiceRequestsAdmin().catch(() => []),
      ]);

      setUsers(userData);
      setServices(serviceData);
      setTransactions(txData);
      setReviews(reviewData);
      setPayments(paymentData);
      setServiceRequests(requestData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Log out and return to the public home page.
    AuthController.logout();
    navigate("/");
  };

  // ── Users ──────────────────────────────────────────────────────────────────

  /**
   * Confirm and delete a user account from the admin panel.
   */
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await UserController.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  /**
   * Toggle a user's role between admin and user after confirmation.
   */
  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await UserController.changeUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  /**
   * Toggle a user's active/inactive status after confirmation.
   */
  const handleToggleActive = async (userId, currentlyActive) => {
    const action = currentlyActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const result = await UserController.toggleUserActive(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: result.is_active } : u));
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  // ── Services ───────────────────────────────────────────────────────────────

  /**
   * Confirm and delete a service from the admin panel.
   */
  const handleDeleteService = async (serviceId, serviceTitle) => {
    if (!window.confirm(`Delete service "${serviceTitle}"? This cannot be undone.`)) return;
    try {
      await ServiceController.deleteServiceAdmin(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  /**
   * Toggle a service's visibility status in the browse list.
   */
  const handleToggleVisibility = async (serviceId) => {
    try {
      const result = await ServiceController.toggleServiceVisibility(serviceId);
      setServices((prev) =>
        prev.map((s) => s.id === serviceId ? { ...s, is_visible: result.is_visible } : s)
      );
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  // ── Reviews ────────────────────────────────────────────────────────────────

  /**
   * Confirm and delete a review from the admin panel.
   */
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await ServiceController.deleteReviewAdmin(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  /**
   * Retrieve the title of a service by its ID, or return a fallback identifier.
   */
  const getServiceTitle = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.title : `Service #${serviceId}`;
  };

  const STATUS_BADGE = {
    requested: "warning text-dark",
    accepted: "primary",
    completed: "success",
    rejected: "danger",
    cancelled: "secondary",
  };

  /**
   * Generate the label for a tab including its count of items.
   */
  const tabLabel = (tab) => {
    const labels = {
      users: `Users (${users.length})`,
      services: `Services (${services.length})`,
      requests: `Service Requests (${serviceRequests.length})`,
      transactions: `Transactions (${transactions.length})`,
      reviews: `Reviews (${reviews.length})`,
      payments: `Stripe Payments (${payments.length})`,
    };
    return labels[tab] || tab;
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Time Bank - Admin</span>
          <div>
            <button className="btn tb-btn-dashboard me-2" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button className="btn tb-btn-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : (
          <>
            {/* Tab navigation */}
            <ul className="nav nav-tabs mb-4">
              {TABS.map((tab) => (
                <li key={tab} className="nav-item">
                  <button
                    className={`nav-link text-capitalize ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabLabel(tab)}
                  </button>
                </li>
              ))}
            </ul>

            {/* ── Users tab ─────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="card shadow-lg">
                <div className="card-body">
                  <h4 className="card-title mb-3">User Management</h4>
                  {users.length === 0 ? (
                    <div className="alert alert-info">No users registered.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Credits</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.id}</td>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`badge bg-${user.role === "admin" ? "danger" : "success"}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td>{user.credits}</td>
                              <td>
                                <span className={`badge bg-${user.is_active ? "success" : "secondary"}`}>
                                  {user.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-warning btn-sm me-1"
                                  onClick={() => handleChangeRole(user.id, user.role)}
                                >
                                  Toggle role
                                </button>
                                <button
                                  className={`btn btn-sm me-1 ${user.is_active ? "btn-outline-secondary" : "btn-outline-success"}`}
                                  onClick={() => handleToggleActive(user.id, user.is_active)}
                                >
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Services tab ──────────────────────────────────────── */}
            {activeTab === "services" && (
              <div className="card shadow-lg">
                <div className="card-body">
                  <h4 className="card-title mb-3">Service Moderation</h4>
                  {services.length === 0 ? (
                    <div className="alert alert-info">No services available.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Cost</th>
                            <th>Owner</th>
                            <th>Rating</th>
                            <th>Visibility</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((service) => (
                            <tr key={service.id}>
                              <td>{service.id}</td>
                              <td>{service.title}</td>
                              <td>{service.cost} credits</td>
                              <td>{service.owner_email}</td>
                              <td>
                                {service.avg_rating != null ? (
                                  <>
                                    <StarDisplay rating={Math.round(service.avg_rating)} />
                                    <span className="text-muted small ms-1">
                                      {service.avg_rating.toFixed(1)} ({service.review_count})
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-muted small">No reviews</span>
                                )}
                              </td>
                              <td>
                                <span className={`badge bg-${service.is_visible ? "success" : "secondary"}`}>
                                  {service.is_visible ? "Visible" : "Hidden"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={`btn btn-sm me-1 ${service.is_visible ? "btn-outline-secondary" : "btn-outline-success"}`}
                                  onClick={() => handleToggleVisibility(service.id)}
                                >
                                  {service.is_visible ? "Hide" : "Show"}
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteService(service.id, service.title)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Service Requests tab ──────────────────────────────── */}
            {activeTab === "requests" && (
              <div className="card shadow-lg">
                <div className="card-body">
                  <h4 className="card-title mb-3">All Service Requests</h4>
                  {serviceRequests.length === 0 ? (
                    <div className="alert alert-info">No service requests yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Service</th>
                            <th>Requester</th>
                            <th>Provider</th>
                            <th>Cost</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceRequests.map((req) => (
                            <tr key={req.id}>
                              <td>{req.id}</td>
                              <td>{getServiceTitle(req.service_id)}</td>
                              <td>{req.requester_email}</td>
                              <td>{req.provider_email}</td>
                              <td>{req.cost} credits</td>
                              <td>
                                <span className={`badge bg-${STATUS_BADGE[req.status] || "secondary"}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="small text-muted">
                                {new Date(req.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Transactions tab ──────────────────────────────────── */}
            {activeTab === "transactions" && (
              <div className="card shadow-lg">
                <div className="card-body">
                  <h4 className="card-title mb-3">Transaction & Balance Monitoring</h4>
                  {transactions.length === 0 ? (
                    <div className="alert alert-info">No transactions yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Counterparty</th>
                            <th>Amount</th>
                            <th>Direction</th>
                            <th>Reason</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td>{tx.id}</td>
                              <td>{tx.user_email}</td>
                              <td>{tx.counterparty_email}</td>
                              <td>{tx.amount} credits</td>
                              <td>
                                <span className={`badge bg-${tx.direction === "credit" ? "success" : "danger"}`}>
                                  {tx.direction === "credit" ? "+" : "-"}{tx.amount}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-secondary">{tx.reason}</span>
                              </td>
                              <td className="small text-muted">
                                {new Date(tx.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* User credit balances summary */}
                  <h5 className="mt-4 mb-3">User Credit Balances</h5>
                  <div className="row g-2">
                    {users.map((user) => (
                      <div key={user.id} className="col-12 col-sm-6 col-md-4">
                        <div className="card border-0 bg-white shadow-sm">
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold">{user.name}</div>
                                <div className="small text-muted">{user.email}</div>
                              </div>
                              <span className="badge bg-primary fs-6">{user.credits} cr</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Reviews tab ───────────────────────────────────────── */}
            {activeTab === "reviews" && (
              <div className="card shadow-lg">
                <div className="card-body">
                  <h4 className="card-title mb-3">Review Moderation</h4>
                  {reviews.length === 0 ? (
                    <div className="alert alert-info">No reviews yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Reviewer</th>
                            <th>Service</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.map((review) => (
                            <tr key={review.id}>
                              <td>{review.id}</td>
                              <td>{review.reviewer_email}</td>
                              <td>{getServiceTitle(review.service_id)}</td>
                              <td><StarDisplay rating={review.rating} /></td>
                              <td className="small">{review.comment || <em className="text-muted">—</em>}</td>
                              <td className="small text-muted">
                                {new Date(review.created_at).toLocaleString()}
                              </td>
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Stripe Payments tab ───────────────────────────────── */}
            {activeTab === "payments" && (
              <div className="card shadow-lg">
                <div className="card-body">
                  <h4 className="card-title mb-3">Stripe Payment History</h4>
                  {payments.length === 0 ? (
                    <div className="alert alert-info">No Stripe payments recorded yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Credits</th>
                            <th>Amount (EUR)</th>
                            <th>Status</th>
                            <th>Stripe Session</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.id}>
                              <td>{p.id}</td>
                              <td>{p.user_email}</td>
                              <td>{p.credits}</td>
                              <td>€{(p.amount_eur_cents / 100).toFixed(2)}</td>
                              <td>
                                <span className={`badge bg-${p.status === "completed" ? "success" : p.status === "failed" ? "danger" : "warning text-dark"}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="small text-muted" style={{ maxWidth: 180 }}>
                                <span title={p.stripe_session_id}>
                                  {p.stripe_session_id.slice(0, 24)}…
                                </span>
                              </td>
                              <td className="small text-muted">
                                {new Date(p.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
