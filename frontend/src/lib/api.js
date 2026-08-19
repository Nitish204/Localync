import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("localync_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Note: only the JWT session token is kept client-side (localStorage).
// The actual password is sent once, over the request body, straight to
// /api/auth/login or /api/auth/register, and is never itself stored —
// the backend immediately hashes (register) or verifies-and-discards
// (login) it. See backend/app/security.py.

export const authApi = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const productApi = {
  list: (params) => api.get("/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  categories: (group) => api.get("/categories", { params: { group } }).then((r) => r.data),
};

export const builderApi = {
  check: (product_ids) =>
    api.post("/pc-builder/check", { product_ids }).then((r) => r.data),
};

export const cartApi = {
  list: () => api.get("/cart").then((r) => r.data),
  add: (product_id, quantity = 1) => api.post("/cart/items", { product_id, quantity }).then((r) => r.data),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
  checkout: () => api.post("/cart/checkout").then((r) => r.data),
  orders: () => api.get("/cart/orders").then((r) => r.data),
};

export const vendorApi = {
  dashboard: () => api.get("/vendor/dashboard").then((r) => r.data),
  products: () => api.get("/vendor/products").then((r) => r.data),
  addProduct: (payload) => api.post("/vendor/products", payload).then((r) => r.data),
  updateProduct: (id, payload) => api.patch(`/vendor/products/${id}`, payload).then((r) => r.data),
  orders: () => api.get("/vendor/orders").then((r) => r.data),
};

export const repairApi = {
  upgrades: (productId) => api.get(`/repair/upgrades/${productId}`).then((r) => r.data),
  technicians: () => api.get("/repair/technicians").then((r) => r.data),
  createRequest: (payload) => api.post("/repair/requests", payload).then((r) => r.data),
  myRequests: () => api.get("/repair/requests/mine").then((r) => r.data),
};

export const technicianApi = {
  requests: () => api.get("/technician/requests").then((r) => r.data),
  updateRequest: (id, status) => api.patch(`/technician/requests/${id}`, { status }).then((r) => r.data),
  setAvailability: (available) =>
    api.patch("/technician/availability", null, { params: { available } }).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard").then((r) => r.data),
  users: () => api.get("/admin/users").then((r) => r.data),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`).then((r) => r.data),
  vendors: () => api.get("/admin/vendors").then((r) => r.data),
  toggleVendor: (id) => api.patch(`/admin/vendors/${id}/toggle`).then((r) => r.data),
  products: () => api.get("/admin/products").then((r) => r.data),
  toggleProduct: (id) => api.patch(`/admin/products/${id}/toggle`).then((r) => r.data),
  orders: () => api.get("/admin/orders").then((r) => r.data),
};

export const advisorApi = {
  recommend: (payload) => api.post("/advisor/recommend", payload).then((r) => r.data),
};

export default api;
