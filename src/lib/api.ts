import axios from "axios";

const API_URL = "https://decent-laundry-backend.vercel.app/api";
// const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

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

  // ✅ UPDATED: ab optional 3rd "extra" param bhi accept karta hai,
  // taake Send to Laundry (sendingDate) aur Received from Laundry (receivingDate)
  // dono status ke sath hi ek hi request mein save ho jaein.
  updateStatus: async (
    orderId: string,
    status: string,
    extra?: { sendingDate?: string; receivingDate?: string;  laundryQuantity?: number; }
  ) => {
    const res = await axios.patch(`${API_URL}/orders/${orderId}`, {
      status,
      ...extra,
    });
    console.log(res , "res>>>>>>>>>>>>>>>>>>>>");
    
    return res.data;
  },

  // DASHBOARD
  getDashboard: async (branchId: string) => {
    const res = await axios.get(`${API_URL}/dashboard/${branchId}`);
    return res.data;
  },
};