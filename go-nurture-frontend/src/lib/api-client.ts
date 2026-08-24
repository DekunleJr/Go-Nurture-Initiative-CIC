/**
 * Centralized API client service
 * Handles all HTTP requests with consistent error handling, authentication, and interceptors
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";

// Get API base URL from environment or fallback
const API_BASE_URL =
  (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  process.env.NEXT_PUBLIC_API_URL ||
  "/";

/**
 * Create axios instance with default config
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /**
   * Request interceptor - attach token and headers
   */
  client.interceptors.request.use(
    (config) => {
      const token = authClient.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor - handle errors and auth failures
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle 401 - Unauthorized (token expired or invalid)
      if (error.response?.status === 401) {
        authClient.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/portal/login";
        }
        toast.error("Session expired. Please log in again.");
      }

      // Handle 403 - Forbidden
      if (error.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      }

      // Handle 404 - Not found
      if (error.response?.status === 404) {
        toast.error("Resource not found.");
      }

      // Handle 500 - Server error
      if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      }

      // Handle network errors
      if (!error.response) {
        toast.error("Network error. Please check your connection.");
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Singleton API client instance
 */
const apiClient = createApiClient();

/**
 * Typed API methods
 */
export const api = {
  /**
   * GET request
   */
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig) => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  /**
   * POST request
   */
  post: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  /**
   * PATCH request
   */
  patch: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  /**
   * PUT request
   */
  put: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  /**
   * DELETE request
   */
  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig) => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};

export default apiClient;
