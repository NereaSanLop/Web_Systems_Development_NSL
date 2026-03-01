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
      `¿Estás seguro de que quieres borrar al usuario "${userName}"?\n\nEsta acción no se puede deshacer.`
    );

    if (confirmed) {
      try {
        await UserController.deleteUser(userId);
        // Actualizar la lista de usuarios después de borrar
        const updatedUsers = users.filter((u) => u.id !== userId);
        setUsers(updatedUsers);
        alert("Usuario borrado exitosamente");
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
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <h2 className="mb-4">Gestión de Usuarios</h2>

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
            No hay usuarios registrados
          </div>
        ) : (
          <div className="card shadow-lg">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Acciones</th>
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
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            🗑️ Borrar
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