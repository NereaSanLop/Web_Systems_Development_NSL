import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserController from "../controllers/userController";
import AuthController from "../controllers/authController";

function Admin() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const userData = await UserController.getAllUsers();
      setUsers(userData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AuthController.logout();
    navigate("/");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      try {
        await UserController.deleteUser(userId);
        const updatedUsers = users.filter((u) => u.id !== userId);
        setUsers(updatedUsers);
        alert("User deleted successfully");
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmed = window.confirm(
      `Change this user's role to "${newRole}"?`
    );

    if (confirmed) {
      try {
        await UserController.changeUserRole(userId, newRole);
        setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      } catch (err) {
        alert(`Error: ${err}`);
      }
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Time Bank - Admin</span>
          <div>
            <button className="btn btn-outline-info me-2" onClick={goToDashboard}>
              Dashboard
            </button>
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <h2 className="mb-4">User Management</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No registered users
          </div>
        ) : (
          <div className="card shadow-lg">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
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
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => handleChangeRole(user.id, user.role)}
                          >
                            Cambiar rol
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            Borrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;