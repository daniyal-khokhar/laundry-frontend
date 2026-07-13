import axios from "axios";

// `.env` se URL read karein, live par yeh automatic sahi uthayega
const API_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:3002/api";

export const orderApi = {
  // GET ALL (Saare orders lane ke liye)
  getAll: async () => {
    const res = await axios.get(`${API_URL}/orders`);
    return res.data;
  },

  // ✨ FIXED: Path ko backend ke mutabiq sirf '/orders' kiya, kyunki query string backend handle kar rha hy
  getByBranch: async (branchId: string, status?: string) => {
    const res = await axios.get(`${API_URL}/orders`, {
      params: { branchId, status },
    });
    return res.data;
  },

  // CREATE ORDER
  create: async (data: any) => {
    const res = await axios.post(`${API_URL}/orders`, data);
    return res.data;
  },

    // ✨ NEW: GET ORDER BY ID (single record fetch karne ke liye)
  getById: async (orderId: string) => {
    const res = await axios.get(`${API_URL}/orders/${orderId}`);
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