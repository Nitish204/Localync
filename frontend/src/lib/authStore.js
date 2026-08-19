import { create } from "zustand";
import { authApi } from "./api";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("localync_token") || null,
  status: "idle", // idle | loading | error
  error: null,

  async login(email, password) {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem("localync_token", data.access_token);
      set({ user: data.user, token: data.access_token, status: "idle" });
      return true;
    } catch (e) {
      set({ status: "error", error: e?.response?.data?.detail || "Login failed." });
      return false;
    }
  },

  async register(payload) {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.register(payload);
      localStorage.setItem("localync_token", data.access_token);
      set({ user: data.user, token: data.access_token, status: "idle" });
      return true;
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(" ")
        : detail || "Registration failed.";
      set({ status: "error", error: msg });
      return false;
    }
  },

  async hydrate() {
    const token = localStorage.getItem("localync_token");
    if (!token) return;
    try {
      const user = await authApi.me();
      set({ user, token });
    } catch {
      localStorage.removeItem("localync_token");
      set({ user: null, token: null });
    }
  },

  logout() {
    localStorage.removeItem("localync_token");
    set({ user: null, token: null });
  },
}));
