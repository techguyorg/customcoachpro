import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Dumbbell,
  Library,
  TrendingUp,
  UserCheck,
  Clock,
  Target,
  Utensils,
  ChefHat,
  UserPlus
} from "lucide-react";
import CoachExercisesPage from "@/pages/coach/ExercisesPage";
import CoachWorkoutProgramsPage from "@/pages/coach/WorkoutProgramsPage";
import ClientsPage from "@/pages/coach/ClientsPage";
import CoachCheckinsPage from "@/pages/coach/CheckinsPage";
import DietPlansPage from "@/pages/coach/DietPlansPage";
import RecipesPage from "@/pages/coach/RecipesPage";
import RequestsPage from "@/pages/coach/RequestsPage";
import CoachSettingsPage from "@/pages/coach/SettingsPage";
import MessagesPage from "@/pages/shared/MessagesPage";
import AnalyticsPage from "@/pages/coach/AnalyticsPage";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { useCoachClients, useClientStats } from "@/hooks/useCoachClients";
import { useCoachCheckins } from "@/hooks/useCheckins";
import { usePendingRequestsCount } from "@/hooks/useCoachRequests";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickAssignDialog } from "@/components/coach/QuickAssignDialog";

function QuickAssignButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="default" className="w-full justify-start text-sm h-9" onClick={() => setOpen(true)}>
        <ClipboardList className="w-4 h-4 mr-2" />
        Assign Plan
      </Button>
      <QuickAssignDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/coach" },
  { type: 'divider', label: 'Clients' },
  { icon: UserPlus, label: "Requests", path: "/coach/requests", badge: true },
  { icon: Users, label: "My Clients", path: "/coach/clients" },
  { icon: CalendarCheck, label: "Check-ins", path: "/coach/checkins" },
  { type: 'divider', label: 'Content' },
  { icon: ClipboardList, label: "Programs", path: "/coach/programs" },
  { icon: Utensils, label: "Diet Plans", path: "/coach/diet-plans" },
  { icon: ChefHat, label: "Recipes", path: "/coach/recipes" },
  { icon: Library, label: "Exercises", path: "/coach/exercises" },
  { type: 'divider', label: 'Business' },
  { icon: MessageSquare, label: "Messages", path: "/coach/messages" },
  { icon: BarChart3, label: "Analytics", path: "/coach/analytics" },
  { icon: Settings, label: "Settings", path: "/coach/settings" },
];

function CoachDashboard() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pendingRequestsCount = usePendingRequestsCount();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">Coach Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item, index) => {
              if ((item as any).type === 'divider') {
                return (
                  <div key={index} className="pt-4 pb-2 px-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                  </div>
                );
              }
              
              const navItem = item as { icon: any; label: string; path: string; badge?: boolean };
              const isActive = location.pathname === navItem.path;
              const showBadge = navItem.badge && pendingRequestsCount > 0;
              return (
                <Link
                  key={navItem.path}
                  to={navItem.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <navItem.icon className="w-4 h-4" />
                  {navItem.label}
                  {showBadge && (
                    <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.fullName?.charAt(0) || 'C'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName || 'Coach'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="shrink-0">
              <Button variant="outline" className="w-full relative z-10" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <h1 className="text-lg font-semibold">Coach Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <ThemeSwitcher />
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Routes>
            <Route index element={<CoachHome />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="programs" element={<CoachWorkoutProgramsPage />} />
            <Route path="diet-plans" element={<DietPlansPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="exercises" element={<CoachExercisesPage />} />
            <Route path="checkins" element={<CoachCheckinsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<CoachSettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function CoachHome() {
  const { user } = useAuth();
  const { data: clients, isLoading: loadingClients } = useCoachClients();
  const stats = useClientStats();
  const { data: checkins, isLoading: loadingCheckins } = useCoachCheckins();

  const pendingCheckins = checkins?.filter(c => c.status === 'submitted') || [];
  const recentClients = clients?.slice(0, 5) || [];
  
  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/10 rounded-xl p-4 border border-primary/20">
        <h2 className="text-lg font-bold">Welcome back, {user?.fullName?.split(' ')[0] || 'Coach'}! 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your clients today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Total Clients</p>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          {loadingClients ? (
            <Skeleton className="h-7 w-12 mt-2" />
          ) : (
            <p className="text-xl font-bold mt-1">{stats.total}</p>
          )}
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Active Clients</p>
            <UserCheck className="w-4 h-4 text-success" />
          </div>
          {loadingClients ? (
            <Skeleton className="h-7 w-12 mt-2" />
          ) : (
            <p className="text-xl font-bold mt-1 text-success">{stats.active}</p>
          )}
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pending Check-ins</p>
            <CalendarCheck className="w-4 h-4 text-warning" />
          </div>
          {loadingCheckins ? (
            <Skeleton className="h-7 w-12 mt-2" />
          ) : (
            <p className="text-xl font-bold mt-1 text-warning">{pendingCheckins.length}</p>
          )}
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pending Invites</p>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          {loadingClients ? (
            <Skeleton className="h-7 w-12 mt-2" />
          ) : (
            <p className="text-xl font-bold mt-1">{stats.pending}</p>
          )}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Client Distribution */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Client Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-success">{stats.active}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all" 
                  style={{ width: stats.total ? `${(stats.active / stats.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-warning">{stats.pending}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all" 
                  style={{ width: stats.total ? `${(stats.pending / stats.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Paused</span>
                <span className="font-medium">{stats.paused}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-muted-foreground transition-all" 
                  style={{ width: stats.total ? `${(stats.paused / stats.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Check-ins */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            Pending Check-ins
          </h3>
          {loadingCheckins ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : pendingCheckins.length > 0 ? (
            <div className="space-y-2">
              {pendingCheckins.slice(0, 4).map((checkin) => (
                <div key={checkin.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">Check-in #{checkin.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkin.checkin_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {pendingCheckins.length > 4 && (
                <Link to="/coach/checkins" className="text-xs text-primary hover:underline block text-center">
                  View all {pendingCheckins.length} pending
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CalendarCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-xs">No pending check-ins</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            <QuickAssignButton />
            <Link to="/coach/clients">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <Users className="w-4 h-4 mr-2" />
                Manage Clients
              </Button>
            </Link>
            <Link to="/coach/programs">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <ClipboardList className="w-4 h-4 mr-2" />
                Browse Programs
              </Button>
            </Link>
            <Link to="/coach/checkins">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <CalendarCheck className="w-4 h-4 mr-2" />
                Review Check-ins
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Recent Clients
          </h3>
          <Link to="/coach/clients" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {loadingClients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : recentClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentClients.map((client) => (
              <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {client.profile?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{client.profile?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{client.profile?.email}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  client.status === 'active' ? 'bg-success' : 
                  client.status === 'pending' ? 'bg-warning' : 'bg-muted-foreground'
                }`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No clients yet. Start by inviting your first client!</p>
            <Link to="/coach/clients">
              <Button className="mt-4">
                <Users className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default CoachDashboard;
