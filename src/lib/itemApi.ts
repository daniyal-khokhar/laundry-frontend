import axios from "axios";

// `.env` se URL read karein, live par yeh automatic sahi uthayega
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export const itemApi = {
  getAll: async (params?: any) => {
    const res = await axios.get(`${API_URL}/items`, { params });
    return res.data;
  },

  getById: async (itemId: string) => {
    const res = await axios.get(`${API_URL}/items/${itemId}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await axios.post(`${API_URL}/items`, data);
    return res.data;
  },

  update: async (itemId: string, data: any) => {
    const res = await axios.patch(`${API_URL}/items/${itemId}`, data);
    return res.data;
  },

  delete: async (itemId: string) => {
    const res = await axios.delete(`${API_URL}/items/${itemId}`);
    return res.data;
  },
};