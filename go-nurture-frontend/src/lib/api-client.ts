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
 * Endpoints where a 401 means "wrong credentials", not "session expired":
 * the calling form must display the backend's error message instead of
 * triggering the logout-and-redirect flow.
 */
const CREDENTIAL_AUTH_ENDPOINTS = ["/api/auth/login", "/api/auth/set-password"];

// Guards against duplicate toasts/redirects when several parallel requests
// fail with 401 at once (the dashboard fetches resources via Promise.all).
let sessionExpiredHandled = false;

/**
 * Create axios instance with default config
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // send the httpOnly auth cookie on every request
    headers: {
      "Content-Type": "application/json",
    },
  });

  /**
   * Response interceptor - handle errors and auth failures
   */
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const requestUrl = error.config?.url ?? "";
      const isCredentialAuth = CREDENTIAL_AUTH_ENDPOINTS.some((endpoint) =>
        requestUrl.includes(endpoint)
      );

      // Handle 401 - Unauthorized (token expired or invalid)
      if (error.response?.status === 401) {
        if (isCredentialAuth) {
          // Wrong credentials on a login/password form: surface the
          // backend's message (e.g. "Invalid email or password") instead
          // of logging the user out.
          const detail = (error.response.data as { detail?: string } | undefined)?.detail;
          if (detail) error.message = detail;
        } else if (!sessionExpiredHandled) {
          sessionExpiredHandled = true;
          authClient.clear();
          toast.error("Session expired. Please log in again.");
          if (typeof window !== "undefined") {
            // Give the toast a moment to be readable before the hard
            // navigation reloads the page and unmounts it.
            window.setTimeout(() => {
              window.location.href = "/portal/login";
            }, 1500);
          }
        }
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
