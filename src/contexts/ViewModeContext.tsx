import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type ViewMode = "coach" | "client";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggle: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = "view_mode";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [viewMode, setViewModeState] = useState<ViewMode>("client");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;

    // Default behavior:
    // - Coaches default to "coach"
    // - Clients default to "client"
    // - Admin has no view mode impact, but keep it safe
    if (user?.role === "coach") {
      setViewModeState(stored ?? "coach");
    } else if (user?.role === "client") {
      setViewModeState("client");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      // admin or null
      setViewModeState("client");
    }
  }, [user?.role]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  const toggle = () => setViewMode(viewMode === "coach" ? "client" : "coach");

  const value = useMemo(() => ({ viewMode, setViewMode, toggle }), [viewMode]);

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
