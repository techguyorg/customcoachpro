import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { CoachDashboard } from "./CoachDashboard";
import { ClientDashboard } from "./ClientDashboard";

export function DashboardPage() {
  const { user } = useAuth();
  const { viewMode } = useViewMode();

  if (user?.role === "coach") {
    // Coach can view either dashboard based on view mode
    return viewMode === "client" ? <ClientDashboard /> : <CoachDashboard />;
  }

  return <ClientDashboard />;
}

export default DashboardPage;
