import api from "../services/api";

class UserController {
  static async getProfile() {
    // Retrieve the authenticated user's profile.
    try {
      const response = await api.get("/me");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Unauthorized";
    }
  }

  static async getAllUsers() {
    // Retrieve all users for admin views.
    try {
      const response = await api.get("/users");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Not authorized";
    }
  }

  static async deleteUser(userId) {
    // Delete a user by its identifier.
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error deleting user";
    }
  }

  static async changeUserRole(userId, newRole) {
    // Update a user's role to the selected value.
    try {
      const response = await api.put(`/users/${userId}/role`, { role: newRole });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error changing role";
    }
  }
}

export default UserController;