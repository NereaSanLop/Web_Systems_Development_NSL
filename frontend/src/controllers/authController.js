import api from "../services/api";

class AuthController {
  static async signup(name, email, password, isAdmin = false) {
    try {
      const response = await api.post("/signup", {
        name,
        email,
        password,
        is_admin: isAdmin,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating user";
    }
  }

  static async login(email, password) {
    try {
      const response = await api.post("/login", {
        email,
        password,
      });
      const token = response.data.access_token;
      localStorage.setItem("token", token);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Invalid credentials";
    }
  }

  static logout() {
    localStorage.removeItem("token");
  }

  static getToken() {
    return localStorage.getItem("token");
  }

  static isAuthenticated() {
    return !!this.getToken();
  }
}

export default AuthController;