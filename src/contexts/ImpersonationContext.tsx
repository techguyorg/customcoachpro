import React, { createContext, useContext, useState } from "react";
import { AppRole } from "@/lib/auth";

interface ImpersonationState {
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  impersonatedRole: AppRole | null;
  impersonatedName: string | null;
}

interface ImpersonationContextType extends ImpersonationState {
  startImpersonation: (userId: string, role: AppRole, name: string) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ImpersonationState>({
    isImpersonating: false,
    impersonatedUserId: null,
    impersonatedRole: null,
    impersonatedName: null,
  });

  const startImpersonation = (userId: string, role: AppRole, name: string) => {
    setState({
      isImpersonating: true,
      impersonatedUserId: userId,
      impersonatedRole: role,
      impersonatedName: name,
    });
  };

  const stopImpersonation = () => {
    setState({
      isImpersonating: false,
      impersonatedUserId: null,
      impersonatedRole: null,
      impersonatedName: null,
    });
  };

  return (
    <ImpersonationContext.Provider value={{ ...state, startImpersonation, stopImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}
