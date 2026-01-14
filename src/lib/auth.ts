// Re-export auth functions from api.ts for backward compatibility
export { auth, type User as AuthUser } from './api';
export type AppRole = 'client' | 'coach' | 'super_admin';

export const getStoredTokens = () => ({
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
});

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const resetPassword = (email: string) => {
  const { auth } = require('./api');
  return auth.forgotPassword(email);
};

export const updatePassword = async (newPassword: string) => {
  // This would need to be called with a token from email link
  throw new Error('Use reset password flow via email');
};

// Stub for Google OAuth
export const getGoogleOAuthUrl = (role?: string) => {
  const clientId = '123456789.apps.googleusercontent.com'; // Replace with actual
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
  const state = role ? encodeURIComponent(JSON.stringify({ role })) : '';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&state=${state}`;
};
