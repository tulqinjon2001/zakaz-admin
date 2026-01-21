import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://zakaz-backend-zij1.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Stores API
export const storesAPI = {
  getAll: () => api.get("/admin/stores"),
  getById: (id) => api.get(`/admin/stores/${id}`),
  create: (data) => api.post("/admin/stores", data),
  update: (id, data) => api.put(`/admin/stores/${id}`, data),
  delete: (id) => api.delete(`/admin/stores/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get("/admin/categories"),
  getById: (id) => api.get(`/admin/categories/${id}`),
  create: (data) => api.post("/admin/categories", data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
};

// Products API
export const productsAPI = {
  getAll: () => api.get("/admin/products"),
  getById: (id) => api.get(`/admin/products/${id}`),
  getNextCode: () => api.get("/admin/products/next-code"),
  create: (data) => api.post("/admin/products", data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
};

// Inventories API
export const inventoriesAPI = {
  create: (data) => api.post("/admin/inventories", data),
  update: (id, data) => api.put(`/admin/inventories/${id}`, data),
  delete: (id) => api.delete(`/admin/inventories/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get("/admin/orders", { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) =>
    api.put(`/admin/orders/${id}/status`, { status }),
};

// Users/Employees API
export const usersAPI = {
  getAll: () => api.get("/admin/users"),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post("/admin/users", data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
