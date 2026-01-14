import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveRole } from "@/contexts/ActiveRoleContext";
import { AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { activeRole, availableRoles } = useActiveRole();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use the active role if it's set and valid, otherwise use the primary role
  const effectiveRole = activeRole && availableRoles.includes(activeRole) ? activeRole : user.role;

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    // Check if user has any of the allowed roles - if so, they're accessing the wrong dashboard
    const hasAllowedRole = allowedRoles.some(role => availableRoles.includes(role));
    
    if (hasAllowedRole) {
      // User can access this dashboard, let them through
      return <>{children}</>;
    }
    
    // Redirect to appropriate dashboard based on effective role
    const dashboardMap: Record<AppRole, string> = {
      super_admin: "/admin",
      coach: "/coach",
      client: "/client",
    };
    return <Navigate to={dashboardMap[effectiveRole]} replace />;
  }

  return <>{children}</>;
}
