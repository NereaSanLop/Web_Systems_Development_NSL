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

  static async requestService(serviceId) {
    // Create a pending request for a browsed service.
    try {
      const response = await api.post(`/services/${serviceId}/requests`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating service request";
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

  static async getIncomingRequests() {
    // Load requests received by the authenticated provider.
    try {
      const response = await api.get("/service-requests/incoming");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading incoming requests";
    }
  }

  static async getOutgoingRequests() {
    // Load requests created by the authenticated requester.
    try {
      const response = await api.get("/service-requests/outgoing");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading outgoing requests";
    }
  }

  static async acceptRequest(requestId) {
    // Accept now finalizes the request and applies the credit transfer server-side.
    try {
      const response = await api.post(`/service-requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error accepting request";
    }
  }

  static async rejectRequest(requestId) {
    // Reject a request without transferring credits.
    try {
      const response = await api.post(`/service-requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error rejecting request";
    }
  }

  static async completeRequest(requestId) {
    // Legacy/manual completion endpoint retained for compatibility.
    try {
      const response = await api.post(`/service-requests/${requestId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error completing request";
    }
  }
}

export default ServiceController;
