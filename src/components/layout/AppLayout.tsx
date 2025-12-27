import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iconTokens, type IconToken } from "@/config/iconTokens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Dumbbell,
  Utensils,
  BarChart3,
  LogOut,
  Settings,
  Menu,
  X,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  tone: IconToken;
};

const coachNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "brand" },
  { to: "/clients", label: "Clients", icon: Users, tone: "neutral" },
  { to: "/check-ins", label: "Check-ins", icon: ClipboardCheck, tone: "warning" },
  { to: "/workout-plans", label: "Workouts", icon: Dumbbell, tone: "workout" },
  { to: "/diet-plans", label: "Diet Plans", icon: Utensils, tone: "diet" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, tone: "analytics" },
] satisfies NavItem[];

const clientNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "brand" },
  { to: "/my-plan", label: "My Plan", icon: Dumbbell, tone: "workout" },
  { to: "/check-in", label: "Check-in", icon: ClipboardCheck, tone: "warning" },
  { to: "/progress", label: "Progress", icon: BarChart3, tone: "analytics" },
] satisfies NavItem[];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { viewMode, toggle } = useViewMode();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isCoach = user?.role === "coach";
  const navItems =
    isCoach && viewMode === "client"
      ? clientNavItems
      : isCoach
      ? coachNavItems
      : clientNavItems;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    const parts = (name || "").trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${a}${b}`.toUpperCase() || "U";
  };

  const displayName = user?.displayName || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || "User";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-energy">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              FitCoach<span className="text-primary">Pro</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-energy"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        iconTokens[item.tone].icon,
                        isActive && "text-primary-foreground"
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Coach ViewMode toggle */}
            {isCoach && (
              <Button variant="outline" size="sm" onClick={toggle} className="hidden md:flex gap-2">
                <Eye className="h-4 w-4" />
                {viewMode === "client" ? "View as Coach" : "View as Client"}
              </Button>
            )}

            <NotificationsBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={user?.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    {isCoach && (
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        View mode: <span className="font-medium">{viewMode}</span>
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {isCoach && (
                  <DropdownMenuItem onClick={toggle}>
                    <Eye className="mr-2 h-4 w-4" />
                    {viewMode === "client" ? "Switch to Coach mode" : "Switch to Client mode"}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card p-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {isCoach && (
                <Button variant="outline" size="sm" onClick={toggle} className="mb-3 gap-2">
                  <Eye className="h-4 w-4" />
                  {viewMode === "client" ? "View as Coach" : "View as Client"}
                </Button>
              )}

              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          iconTokens[item.tone].icon,
                          isActive && "text-primary-foreground"
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="container px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
