import api from "../services/api";

class ServiceController {
  static async browseServices(filters = {}) {
    // Request services from other users using optional browse filters.
    try {
      const params = {};

      if (filters.q && filters.q.trim()) {
        params.q = filters.q.trim();
      }
      if (filters.minCost) {
        params.min_cost = Number(filters.minCost);
      }
      if (filters.maxCost) {
        params.max_cost = Number(filters.maxCost);
      }

      const response = await api.get("/services/browse", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error browsing services";
    }
  }

  static async getMyServices() {
    // Load services created by the authenticated user.
    try {
      const response = await api.get("/services");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading services";
    }
  }

  static async createService(payload) {
    // Create a new service owned by the authenticated user.
    try {
      const response = await api.post("/services", payload);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating service";
    }
  }

  static async updateService(serviceId, payload) {
    // Update one of the authenticated user's existing services.
    try {
      const response = await api.put(`/services/${serviceId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error updating service";
    }
  }

  static async deleteService(serviceId) {
    // Remove one of the authenticated user's services.
    try {
      const response = await api.delete(`/services/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error deleting service";
    }
  }
}

export default ServiceController;
