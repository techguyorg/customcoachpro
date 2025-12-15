import { API_ENDPOINTS } from '@/config/api';
import apiService from './api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.auth.login, credentials);
    apiService.setToken(response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.auth.register, data);
    apiService.setToken(response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.auth.logout);
    } finally {
      apiService.setToken(null);
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>(API_ENDPOINTS.auth.me);
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await apiService.post<AuthResponse>(API_ENDPOINTS.auth.refresh, { refreshToken });
    apiService.setToken(response.token);
    return response;
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!apiService.getToken() && !!this.getStoredUser();
  },
};

export default authService;
