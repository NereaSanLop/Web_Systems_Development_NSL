import api from "../services/api";

class ServiceController {
  static async getMyServices() {
    try {
      const response = await api.get("/services");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading services";
    }
  }

  static async createService(payload) {
    try {
      const response = await api.post("/services", payload);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating service";
    }
  }

  static async updateService(serviceId, payload) {
    try {
      const response = await api.put(`/services/${serviceId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error updating service";
    }
  }

  static async deleteService(serviceId) {
    try {
      const response = await api.delete(`/services/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error deleting service";
    }
  }
}

export default ServiceController;
