import axios from "axios";

// `.env` se URL read karein, agar na mile to fallback lagayein
const API_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:3002/api";

export const orderApi = {
  // GET ALL (Saare orders lane ke liye)
  getAll: async () => {
    const res = await axios.get(`${API_URL}/orders`);
    return res.data;
  },

  // 💥 FIXED: Path badal kar '/orders/branch' kiya jo backend par set hai
  getByBranch: async (branchId: string, status?: string) => {
    const res = await axios.get(`${API_URL}/orders/branch`, {
      params: { branchId, status },
    });
    return res.data;
  },

  // CREATE ORDER
  create: async (data: any) => {
    const res = await axios.post(`${API_URL}/orders`, data);
    return res.data;
  },

  // UPDATE STATUS
  updateStatus: async (orderId: string, status: string) => {
    const res = await axios.patch(`${API_URL}/orders/${orderId}`, {
      status,
    });
    return res.data;
  },

  // DASHBOARD
  getDashboard: async (branchId: string) => {
    const res = await axios.get(`${API_URL}/dashboard/${branchId}`);
    return res.data;
  },
};