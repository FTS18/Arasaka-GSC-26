import axios from "axios";
import { queueRequest } from "./idb";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL;
const BACKEND_URL = (rawBackendUrl && rawBackendUrl !== "undefined"
  ? rawBackendUrl
  : "http://127.0.0.1:8000").replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("janrakshak_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // 🏛️ Strategy: Offline Delta-Sync
    // If it's a mutation and we're likely offline or network failed
    const isMutation = ['post', 'put', 'delete', 'patch'].includes(err.config?.method?.toLowerCase());
    const isNetworkError = !err.response && !window.navigator.onLine;

    if (isMutation && isNetworkError) {
      queueRequest(err.config.url, err.config.method, err.config.data);
      return Promise.resolve({ data: { _offline: true }, status: 202 });
    }

    if (err?.response?.status === 401) {
      // let caller handle
    }
    return Promise.reject(err);
  }
);
