import { Navigate } from "react-router-dom";
import AuthController from "../controllers/authController";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = AuthController.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
