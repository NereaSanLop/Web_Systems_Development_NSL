import api from "../services/api";

class AuthController {
  static async signup(name, email, password) {
    // Create a new user account.
    try {
      const response = await api.post("/signup", {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating user";
    }
  }

  static async login(email, password) {
    // Authenticate user credentials and store the token.
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
    // Remove the stored authentication token.
    localStorage.removeItem("token");
  }

  static getToken() {
    // Return the current authentication token.
    return localStorage.getItem("token");
  }

  static isAuthenticated() {
    // Check whether a valid token exists in storage.
    return !!this.getToken();
  }
}

export default AuthController;