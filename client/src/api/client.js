import axios from "axios";

// In local dev, Vite proxies /api to the server (see vite.config.js).
// In production, VITE_API_URL points straight at the deployed backend.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("apna-hisab-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
