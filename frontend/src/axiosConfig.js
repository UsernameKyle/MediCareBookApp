import axios from "axios";

/**
 * Central Axios instance.
 * Base URL is read from the Vite environment variable VITE_API_BASE_URL.
 * This keeps the API origin out of source code and swappable per environment.
 *
 * Usage:
 *   import axiosInstance from "../axiosConfig";
 *   axiosInstance.post("/api/user/login", payload, { headers: authHeader() })
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  // Do not set a global Content-Type here. Let Axios infer it per-request
  // (important for multipart/form-data uploads so the boundary is set).
});

/**
 * Returns the Authorization header object for protected requests.
 * Token is read fresh on every call so logout clears it immediately.
 */
export const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default axiosInstance;
