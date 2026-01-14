import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, User } from "@/lib/api";

type AppRole = "client" | "coach" | "super_admin";

interface AuthUser extends User {
  role?: AppRole;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (data: SignInData) => Promise<{ error: Error | null }>;
  signInWithGoogle: (code: string, role?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (auth.isAuthenticated()) {
        try {
          const userData = await auth.getMe();
          setUser({
            ...userData,
            role: userData.roles[0] as AppRole,
          });
        } catch {
          auth.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      const response = await auth.signup(data.email, data.password, data.fullName, data.role as "client" | "coach");
      setUser({
        ...response.user,
        role: response.user.roles[0] as AppRole,
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const response = await auth.login(data.email, data.password);
      setUser({
        ...response.user,
        role: response.user.roles[0] as AppRole,
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async (_code: string, _role?: string) => {
    // Google OAuth will be handled separately
    return { error: new Error("Google OAuth not yet implemented") };
  };

  const signOut = async () => {
    await auth.logout();
    setUser(null);
  };

  const hasRole = (role: AppRole) => {
    return user?.role === role || user?.roles?.includes(role) || false;
  };

  const refreshUser = async () => {
    try {
      const userData = await auth.getMe();
      setUser({
        ...userData,
        role: userData.roles[0] as AppRole,
      });
    } catch {
      // Ignore errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { AppRole, AuthUser };
