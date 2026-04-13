import axios, { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
  createAuthSessionNotice,
  getCurrentAppPath,
  redirectToLogin,
  saveAuthSessionNotice,
} from "@/utils/authSession";
import { applyRequestErrorMessage } from "@/utils/requestError";

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (!configuredBaseUrl) {
    return "/api";
  }

  return configuredBaseUrl.replace(/\/+$/, "");
};

// Create axios instance with default configuration
const request = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

// Flag to track if token refresh is in progress
let isRefreshing = false;

// Queue to store callbacks for requests waiting for token refresh
type RefreshCallback = (newToken: string) => void;
type RefreshErrorCallback = (error: unknown) => void;
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _loadingToken?: string;
  skipGlobalLoading?: boolean;
  loadingLabel?: string;
  loadingBlocking?: boolean;
};

let refreshQueue: Array<{
  onSuccess: RefreshCallback;
  onError: RefreshErrorCallback;
}> = [];

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh"];

/**
 * Execute all queued requests with the new token
 * @param newToken - The new access token
 */
const executeRefreshQueue = (newToken: string) => {
  refreshQueue.forEach(({ onSuccess }) => onSuccess(newToken));
  refreshQueue = [];
};

/**
 * Reject all queued requests when refresh fails
 * @param error - The error that caused refresh to fail
 */
const rejectRefreshQueue = (error: unknown) => {
  refreshQueue.forEach(({ onError }) => onError(error));
  refreshQueue = [];
};

/**
 * Add request to the refresh queue
 * @param callback - Callback to execute when token is refreshed
 */
const addToRefreshQueue = (
  onSuccess: RefreshCallback,
  onError: RefreshErrorCallback,
) => {
  refreshQueue.push({ onSuccess, onError });
};

/**
 * Check whether the request should bypass token refresh handling
 * @param url - The request URL
 * @returns True when the request is an auth endpoint
 */
const isAuthRoute = (url?: string) => {
  return AUTH_ROUTES.some((route) => url?.includes(route));
};

/**
 * Get auth store lazily to avoid initialization issues
 * Uses dynamic import to ensure Pinia is already initialized
 */
const getAuthStore = async () => {
  const { useAuthStore } = await import("@/stores/auth");
  const { pinia } = await import("@/stores/pinia");
  return useAuthStore(pinia);
};

const getLoadingStore = async () => {
  const { useLoadingStore } = await import("@/stores/loading");
  const { pinia } = await import("@/stores/pinia");
  return useLoadingStore(pinia);
};

const clearAuthStorageFallback = () => {
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
  localStorage.removeItem("company_info");
  localStorage.removeItem("rbac_profile");
  localStorage.removeItem("user_role");
  localStorage.removeItem("username");
};

const handleExpiredSessionRedirect = async (reason: "session-expired" | "auth-required") => {
  const redirectTo = getCurrentAppPath();
  saveAuthSessionNotice(createAuthSessionNotice(reason, redirectTo));

  try {
    const authStore = await getAuthStore();
    authStore.clearTokens();
  } catch {
    clearAuthStorageFallback();
  }

  redirectToLogin(reason, redirectTo);
};

const shouldTrackGlobalLoading = (config?: RetryableRequestConfig) => {
  if (!config) {
    return false;
  }

  return !config.skipGlobalLoading && !isAuthRoute(config.url);
};

const beginRequestLoading = async (config: RetryableRequestConfig) => {
  if (!shouldTrackGlobalLoading(config) || config._loadingToken) {
    return;
  }

  const loadingStore = await getLoadingStore();
  config._loadingToken = loadingStore.beginTask({
    source: "request",
    label: config.loadingLabel || "Syncing workspace data",
    blocking: Boolean(config.loadingBlocking),
  });
};

const endRequestLoading = async (config?: RetryableRequestConfig) => {
  if (!config?._loadingToken) {
    return;
  }

  const loadingStore = await getLoadingStore();
  loadingStore.endTask(config._loadingToken);
  delete config._loadingToken;
};

/**
 * Request interceptor - automatically attach access token to Authorization header
 */
request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestConfig = config as RetryableRequestConfig;

    try {
      await beginRequestLoading(requestConfig);
      const authStore = await getAuthStore();
      let token = authStore.getAccessToken();

      if (!isAuthRoute(requestConfig.url)) {
        token = await authStore.ensureValidAccessToken(30_000);
      }

      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore errors when getting auth store
    }
    return requestConfig;
  },
  async (error: AxiosError & { config?: RetryableRequestConfig }) => {
    await endRequestLoading(error.config);
    return Promise.reject(applyRequestErrorMessage(error, "The request could not be sent."));
  },
);

/**
 * Response interceptor - handle 401 errors and attempt token refresh
 */
request.interceptors.response.use(
  async (response: AxiosResponse) => {
    await endRequestLoading(response.config as RetryableRequestConfig);
    return response;
  },
  async (error: AxiosError & { config?: RetryableRequestConfig }) => {
    const normalizedError = applyRequestErrorMessage(error, "The request could not be completed.");
    const originalRequest = normalizedError.config;

    // Check if error is 401 Unauthorized
    if (normalizedError.response?.status !== 401 || !originalRequest) {
      await endRequestLoading(originalRequest);
      return Promise.reject(normalizedError);
    }

    // Auth endpoints should return their own 401 response to the caller
    if (isAuthRoute(originalRequest.url) || originalRequest._retry) {
      await endRequestLoading(originalRequest);
      return Promise.reject(normalizedError);
    }

    // If token refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addToRefreshQueue(
          (newToken: string) => {
            try {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(request(originalRequest));
            } catch (err) {
              reject(err);
            }
          },
          async (refreshError: unknown) => {
            await endRequestLoading(originalRequest);
            reject(refreshError);
          },
        );
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      // Get refresh token from localStorage directly to avoid store initialization issues
      const refreshToken = localStorage.getItem("refresh_token");

      // If no refresh token, clear all tokens and redirect to login
        if (!refreshToken) {
          rejectRefreshQueue(normalizedError);
          await endRequestLoading(originalRequest);
          await handleExpiredSessionRedirect("auth-required");
          return Promise.reject(normalizedError);
        }

      // Attempt to refresh the access token
      try {
        const authStore = await getAuthStore();
        const newAccessToken = await authStore.refreshAccessToken();

        // If refresh failed, clear tokens and redirect to login
        if (!newAccessToken) {
          rejectRefreshQueue(normalizedError);
          await endRequestLoading(originalRequest);
          await handleExpiredSessionRedirect("session-expired");
          return Promise.reject(normalizedError);
        }

        // Execute all queued requests with the new token
        executeRefreshQueue(newAccessToken);

        // Retry the original request with the new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return request(originalRequest);
      } catch (refreshError) {
        // If refresh request failed, clear tokens and redirect to login
        rejectRefreshQueue(refreshError);
        await endRequestLoading(originalRequest);
        await handleExpiredSessionRedirect("session-expired");
        return Promise.reject(refreshError);
      }
    } finally {
      isRefreshing = false;
    }
  },
);

export default request;
