// Auth Azure compatibility layer - redirects to main auth
export { auth, getStoredTokens, clearAuth, getGoogleOAuthUrl, getGoogleOAuthUrl as getGoogleAuthUrl } from './auth';
export type { AppRole, AuthUser } from './auth';

export const verifyEmail = async (token: string) => {
  const { auth } = await import('./api');
  return auth.verifyEmail(token);
};

export const resendVerificationEmail = async () => {
  const { auth } = await import('./api');
  return auth.resendVerification();
};
