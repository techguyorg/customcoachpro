import { API_ENDPOINTS } from '@/config/api';
import apiService from './api';
import type { User, LoginRequest, RegisterRequest, AuthResponse, UserRole } from '@/types';

function normalizeRole(role: unknown): UserRole {
  const r = String(role ?? '').toLowerCase();
  if (r === 'coach') return 'coach';
  if (r === 'admin') return 'admin';
  return 'client';
}

function nameToFirstLast(displayName: string): { firstName?: string; lastName?: string } {
  const dn = (displayName ?? '').trim();
  if (!dn) return {};
  const parts = dn.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Backend /api/auth/login returns:
 * {
 *  token, refreshToken,
 *  user: { id, email, role: "Coach|Client|Admin", displayName: "..." }
 * }
 */
function toUserFromLoginResponse(rawUser: any): User {
  const role = normalizeRole(rawUser?.role);
  const displayName = (rawUser?.displayName ?? rawUser?.profile?.displayName ?? rawUser?.email ?? '').trim();
  const { firstName, lastName } = nameToFirstLast(displayName);

  return {
    id: rawUser?.id,
    email: rawUser?.email,
    role,
    displayName: displayName || undefined,
    firstName: rawUser?.firstName ?? firstName,
    lastName: rawUser?.lastName ?? lastName,
    avatarUrl: rawUser?.avatarUrl ?? rawUser?.profile?.avatarUrl,
  };
}

/**
 * Backend /api/auth/me returns:
 * {
 *  id, email, role: "Coach|Client|Admin",
 *  profile: { displayName, bio, avatarUrl }
 * }
 */
function toUserFromMeResponse(raw: any): User {
  const role = normalizeRole(raw?.role);
  const displayName = (raw?.profile?.displayName ?? raw?.displayName ?? raw?.email ?? '').trim();
  const { firstName, lastName } = nameToFirstLast(displayName);

  return {
    id: raw?.id,
    email: raw?.email,
    role,
    displayName: displayName || undefined,
    firstName: raw?.firstName ?? firstName,
    lastName: raw?.lastName ?? lastName,
    avatarUrl: raw?.profile?.avatarUrl ?? raw?.avatarUrl,
  };
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<any>(API_ENDPOINTS.auth.login, credentials);

    // token storage
    apiService.setToken(response.token);

    // refresh token storage (required for refresh flow)
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    // normalize user into the shape frontend expects
    const user = toUserFromLoginResponse(response.user);
    localStorage.setItem('user', JSON.stringify(user));

    return {
      token: response.token,
      refreshToken: response.refreshToken,
      user,
    };
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // NOTE: if your backend doesn't implement register yet, this may fail.
    const response = await apiService.post<any>(API_ENDPOINTS.auth.register, data);

    apiService.setToken(response.token);

    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    const user = toUserFromLoginResponse(response.user);
    localStorage.setItem('user', JSON.stringify(user));

    return {
      token: response.token,
      refreshToken: response.refreshToken,
      user,
    };
  },

  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.auth.logout);
    } finally {
      apiService.setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
    }
  },

  async getCurrentUser(): Promise<User> {
    const raw = await apiService.get<any>(API_ENDPOINTS.auth.me);
    const user = toUserFromMeResponse(raw);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');

    const response = await apiService.post<any>(API_ENDPOINTS.auth.refresh, { refreshToken });
    apiService.setToken(response.token);

    // some backends rotate refresh tokens; store if provided
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    // user might not be returned by refresh endpoint - keep stored user
    const stored = this.getStoredUser();

    return {
      token: response.token,
      refreshToken: response.refreshToken ?? refreshToken ?? '',
      user: stored ?? { id: '', email: '', role: 'client' },
    };
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
