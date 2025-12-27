// src/services/api.ts

import { API_BASE_URL } from "@/config/api";

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private refreshHandler?: () => Promise<{ token: string } | { token: string | null } | string | null>;
  private logoutHandler?: () => Promise<void> | void;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setRefreshHandler(
    handler: () => Promise<{ token: string } | { token: string | null } | string | null>
  ) {
    this.refreshHandler = handler;
  }

  setLogoutHandler(handler: () => Promise<void> | void) {
    this.logoutHandler = handler;
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (!this.refreshHandler) return null;
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshHandler()
        .then((result) => {
          const token =
            typeof result === "string"
              ? result
              : result?.token ?? null;

          if (token) {
            this.setToken(token);
          }

          return token;
        })
        .catch(() => null)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  private async handleUnauthorized() {
    this.setToken(null);
    localStorage.removeItem("refresh_token");

    if (this.logoutHandler) {
      await this.logoutHandler();
      return;
    }

    window.location.href = "/login";
  }

  private async performFetch(url: string, headers: HeadersInit, options: RequestInit) {
    try {
      return await fetch(url, { ...options, headers });
    } catch {
      throw new Error("Network error: API is unreachable. Is the backend running?");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, hasRetried = false): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await this.performFetch(url, headers, options);

    if (response.status === 401) {
      if (!hasRetried) {
        const refreshed = await this.tryRefreshToken();

        if (refreshed) {
          return this.request<T>(endpoint, options, true);
        }
      }

      await this.handleUnauthorized();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    // handle empty responses safely (204, etc.)
    const text = await response.text();
    return (text ? JSON.parse(text) : ({} as T)) as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile(endpoint: string, file: File, fieldName = "file"): Promise<unknown> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const url = `${this.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
