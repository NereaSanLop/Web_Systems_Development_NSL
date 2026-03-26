import { Navigate } from "react-router-dom";
import AuthController from "../controllers/authController";

export default function ProtectedRoute({ children }) {
  // Redirect unauthenticated users to the login page.
  const isAuthenticated = AuthController.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
