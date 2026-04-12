import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Services from "./components/Services";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // Define application routes and protected sections.
  return (
    <Router>
      <Routes>

        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rutas protegidas (requieren token) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse-services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
