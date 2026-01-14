import { useNavigate } from "react-router-dom";
import { AppRole } from "@/lib/auth";
import { useActiveRole } from "@/contexts/ActiveRoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Repeat, Shield, Users, Dumbbell, Check } from "lucide-react";

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; path: string; color: string }> = {
  super_admin: {
    label: "Super Admin",
    icon: Shield,
    path: "/admin",
    color: "text-red-500",
  },
  coach: {
    label: "Coach",
    icon: Dumbbell,
    path: "/coach",
    color: "text-blue-500",
  },
  client: {
    label: "Client",
    icon: Users,
    path: "/client",
    color: "text-green-500",
  },
};

export function RoleSwitcher() {
  const navigate = useNavigate();
  const { activeRole, setActiveRole, availableRoles } = useActiveRole();

  // Don't show if user has only one role
  if (availableRoles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = (role: AppRole) => {
    setActiveRole(role);
    const config = ROLE_CONFIG[role];
    // Force navigation to the new dashboard
    navigate(config.path, { replace: true });
  };

  const currentConfig = activeRole ? ROLE_CONFIG[activeRole] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Repeat className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">
            {currentConfig?.label || "Switch Role"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => {
          const config = ROLE_CONFIG[role];
          const isActive = role === activeRole;
          const Icon = config.icon;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className="gap-2 cursor-pointer"
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className="flex-1">{config.label}</span>
              {isActive && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
