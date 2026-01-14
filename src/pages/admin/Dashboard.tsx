import { Routes, Route, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Sliders,
  ClipboardList,
  FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdminStats";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { SystemContentManager } from "@/components/admin/SystemContentManager";
import { PlatformAnalytics } from "@/components/admin/PlatformAnalytics";
import { SuperAdminManagement } from "@/components/admin/SuperAdminManagement";
import { PlatformSettings } from "@/components/admin/PlatformSettings";
import { ChangePasswordCard } from "@/components/shared/ChangePasswordCard";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { PageHeader } from "@/components/shared/PageHeader";
import { RelationshipsView } from "@/components/admin/RelationshipsView";
import { PendingRequestsView } from "@/components/admin/PendingRequestsView";
import { BulkImportExport } from "@/components/admin/BulkImportExport";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { BlogManagement } from "@/components/blog/BlogManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, UserCheck, Handshake, Clock } from "lucide-react";
import { AdminUser } from "@/hooks/useAdminUsers";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: ShieldCheck, label: "Super Admins", path: "/admin/super-admins" },
  { icon: Dumbbell, label: "Content", path: "/admin/content" },
  { icon: FileText, label: "Blog", path: "/admin/blog" },
  { icon: ClipboardList, label: "Audit Logs", path: "/admin/audit-logs" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Sliders, label: "Platform", path: "/admin/platform" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">Super Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 font-semibold">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
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
              <h1 className="text-lg font-semibold">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="super-admins" element={<SuperAdminsPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="content/import-export" element={<ImportExportPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/relationships" element={<RelationshipsPage />} />
            <Route path="analytics/requests" element={<RequestsPage />} />
            <Route path="platform" element={<PlatformPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AdminHome() {
  const { data: stats, isLoading } = useAdminStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/admin/users")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/admin/users?filter=coach")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Coaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalCoaches || 0}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/admin/analytics/relationships")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Handshake className="w-4 h-4 text-green-500" />
              Active Relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.activeCoachings || 0}</p>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/admin/analytics/requests")}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Pending Requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users, system content, and platform analytics from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/users" className="p-4 rounded-lg border hover:bg-muted transition-colors">
              <Users className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-medium">User Management</h3>
              <p className="text-sm text-muted-foreground">View and manage all platform users</p>
            </Link>
            <Link to="/admin/content" className="p-4 rounded-lg border hover:bg-muted transition-colors">
              <Dumbbell className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-medium">Content Management</h3>
              <p className="text-sm text-muted-foreground">Manage exercises, plans, and recipes</p>
            </Link>
            <Link to="/admin/analytics" className="p-4 rounded-lg border hover:bg-muted transition-colors">
              <BarChart3 className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-medium">Analytics</h3>
              <p className="text-sm text-muted-foreground">View platform statistics</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startImpersonation } = useImpersonation();
  const initialFilter = searchParams.get("filter") || "all";

  const handleImpersonate = (user: AdminUser) => {
    const impersonateRole = user.roles.find(r => r !== "super_admin") || "client";
    startImpersonation(user.user_id, impersonateRole, user.full_name);
    
    if (impersonateRole === "coach") {
      navigate("/coach");
    } else {
      navigate("/client");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all platform users and their roles"
      />
      <UserManagementTable onImpersonate={handleImpersonate} initialRoleFilter={initialFilter} />
    </div>
  );
}

function SuperAdminsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Management"
        description="Manage super administrator access"
      />
      <SuperAdminManagement />
    </div>
  );
}

function PlatformPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure platform-wide settings and feature flags"
      />
      <PlatformSettings />
    </div>
  );
}

function ContentPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "exercises";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management"
        description="Manage system exercises, workout templates, diet plans, recipes, and foods"
        actions={
          <Link to="/admin/content/import-export">
            <Button variant="outline">Bulk Import/Export</Button>
          </Link>
        }
      />
      <SystemContentManager initialTab={initialTab} />
    </div>
  );
}

function ImportExportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import/Export"
        description="Import or export system content using CSV files"
      />
      <BulkImportExport />
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="View platform-wide statistics and metrics"
      />
      <PlatformAnalytics />
    </div>
  );
}

function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all administrative actions on the platform"
      />
      <AuditLogViewer />
    </div>
  );
}

function RelationshipsPage() {
  return <RelationshipsView />;
}

function RequestsPage() {
  return <PendingRequestsView />;
}

function BlogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Management"
        description="Manage blog posts and permissions"
      />
      <BlogManagement />
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your account settings"
      />
      <ChangePasswordCard />
    </div>
  );
}

export default AdminDashboard;
