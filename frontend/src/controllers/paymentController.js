import api from "../services/api";

class PaymentController {
  /**
   * Initiate a Stripe Checkout Session to purchase time credits.
   */
  static async createCheckoutSession(credits) {
    try {
      const response = await api.post("/payments/create-checkout-session", { credits });
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error creating checkout session";
    }
  }

  /**
   * Retrieve the current user's Stripe payment history.
   */
  static async getMyPayments() {
    try {
      const response = await api.get("/payments/my");
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || "Error loading payments";
    }
  }

  /**
   * Retrieve all Stripe payments for admin monitoring.
   */
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
