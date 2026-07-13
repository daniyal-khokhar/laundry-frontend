import axios from "axios";

const API_URL = "https://decent-laundry-backend.vercel.app/api";

export const orderApi = {
  // GET ALL
  getAll: async (query: any) => {
    const res = await axios.get(`${API_URL}/orders`);
    console.log('Fetching all orders:', res.data);
    return res.data;
  },

  // GET BY BRANCH (FIX ERROR)
  getByBranch: async (branchId: string, status?: string) => {
    const res = await axios.get(`${API_URL}/orders`, {
      params: { branchId, status },
    });
    console.log('Fetching orders with params:', { branchId, status , res: res.data});
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

    // ✨ NEW: UPDATE ORDER (poori order details edit karne ke liye)
  update: async (orderId: string, data: any) => {
    const res = await axios.patch(`${API_URL}/orders/${orderId}`, data);
    return res.data;
  },

  // ✨ NEW: DELETE ORDER
  delete: async (orderId: string) => {
    const res = await axios.delete(`${API_URL}/orders/${orderId}`);
    return res.data;
  },

  // UPDATE STATUS (FIX ERROR)
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