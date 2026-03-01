import api from "../services/api";

class UserController {
  static async getProfile() {
    try {
      const response = await api.get("/me");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Unauthorized";
    }
  }

  static async getAllUsers() {
    try {
      const response = await api.get("/users");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Not authorized";
    }
  }

  static async deleteUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error deleting user";
    }
  }
}

export default UserController;