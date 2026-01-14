import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";

const STORAGE_KEY = "customcoachpro_active_role";

interface ActiveRoleContextType {
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  availableRoles: AppRole[];
}

const ActiveRoleContext = createContext<ActiveRoleContextType | undefined>(undefined);

export function ActiveRoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);

  const availableRoles = (user?.roles || []) as AppRole[];

  useEffect(() => {
    if (!user || availableRoles.length === 0) {
      setActiveRoleState(null);
      return;
    }

    const savedRole = localStorage.getItem(STORAGE_KEY) as AppRole | null;
    
    if (savedRole && availableRoles.includes(savedRole)) {
      setActiveRoleState(savedRole);
    } else {
      const defaultRole = (user.role || availableRoles[0]) as AppRole;
      setActiveRoleState(defaultRole);
      localStorage.setItem(STORAGE_KEY, defaultRole);
    }
  }, [user, availableRoles.join(",")]);

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_KEY, role);
  };

  return (
    <ActiveRoleContext.Provider value={{ activeRole, setActiveRole, availableRoles }}>
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole() {
  const context = useContext(ActiveRoleContext);
  if (context === undefined) {
    throw new Error("useActiveRole must be used within an ActiveRoleProvider");
  }
  return context;
}
