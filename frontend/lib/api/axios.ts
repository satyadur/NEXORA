import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

/* ================= REQUEST ================= */
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= RESPONSE ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      Cookies.remove("token");
      Cookies.remove("role");

      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes("/")) {
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
