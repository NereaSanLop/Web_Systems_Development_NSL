import api from "../services/api";

class PaymentController {
  static async createCheckoutSession(credits) {
    try {
      const response = await api.post("/payments/create-checkout-session", { credits });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating checkout session";
    }
  }

  static async getMyPayments() {
    try {
      const response = await api.get("/payments/my");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading payments";
    }
  }

  static async getAllPaymentsAdmin() {
    try {
      const response = await api.get("/admin/payments");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading payments";
    }
  }
}

export default PaymentController;
