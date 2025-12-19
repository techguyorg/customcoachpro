import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import type { UserRole } from "@/types";

// Layouts
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";

// Coach Pages
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ClientsPage } from "@/pages/clients/ClientsPage";
import { ClientDetailPage } from "@/pages/clients/ClientDetailPage";
import { NewClientPage } from "@/pages/clients/NewClientPage";
import { CheckInsPage } from "@/pages/checkins/CheckInsPage";
import { WorkoutPlansPage } from "@/pages/workouts/WorkoutPlansPage";
import { CreateWorkoutPlanPage } from "@/pages/workouts/CreateWorkoutPlanPage";
import { EditWorkoutPlanPage } from "@/pages/workouts/EditWorkoutPlanPage";
import { AssignWorkoutPlanPage } from "@/pages/workouts/AssignWorkoutPlanPage";
import { DietPlansPage } from "@/pages/diet/DietPlansPage";
import { CreateDietPlanPage } from "@/pages/diet/CreateDietPlanPage";
import { EditDietPlanPage } from "@/pages/diet/EditDietPlanPage";
import { AssignDietPlanPage } from "@/pages/diet/AssignDietPlanPage";
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";

// ✅ Sprint 2: Edit Client page
import EditClientPage from "@/pages/clients/EditClientPage";

// Client Pages
import { MyPlanPage } from "@/pages/client/MyPlanPage";
import { CheckInPage } from "@/pages/client/CheckInPage";
import { ProgressPage } from "@/pages/client/ProgressPage";

// Admin
import { AdminPage } from "@/pages/admin/AdminPage";

// Settings
import { SettingsPage } from "@/pages/settings/SettingsPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Admin strict routing
  if (user.role === "admin" && !allowed.includes("admin")) {
    return <Navigate to="/admin" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared (Coach/Client only) */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allowed={["coach", "client"]}>
              <DashboardPage />
            </RoleRoute>
          }
        />

        {/* Settings (Coach/Client only for now) */}
        <Route
          path="/settings"
          element={
            <RoleRoute allowed={["coach", "client"]}>
              <SettingsPage />
            </RoleRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowed={["admin"]}>
              <AdminPage />
            </RoleRoute>
          }
        />

        {/* Coach Routes */}
        <Route
          path="/clients"
          element={
            <RoleRoute allowed={["coach"]}>
              <ClientsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <RoleRoute allowed={["coach"]}>
              <NewClientPage />
            </RoleRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <RoleRoute allowed={["coach"]}>
              <ClientDetailPage />
            </RoleRoute>
          }
        />

        {/* ✅ Sprint 2: Edit client route */}
        <Route
          path="/clients/:id/edit"
          element={
            <RoleRoute allowed={["coach"]}>
              <EditClientPage />
            </RoleRoute>
          }
        />

        <Route
          path="/check-ins"
          element={
            <RoleRoute allowed={["coach"]}>
              <CheckInsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/workout-plans"
          element={
            <RoleRoute allowed={["coach"]}>
              <WorkoutPlansPage />
            </RoleRoute>
          }
        />
        <Route
          path="/workout-plans/new"
          element={
            <RoleRoute allowed={["coach"]}>
              <CreateWorkoutPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/workout-plans/:id/edit"
          element={
            <RoleRoute allowed={["coach"]}>
              <EditWorkoutPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/workout-plans/:id/assign"
          element={
            <RoleRoute allowed={["coach"]}>
              <AssignWorkoutPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/diet-plans"
          element={
            <RoleRoute allowed={["coach"]}>
              <DietPlansPage />
            </RoleRoute>
          }
        />
        <Route
          path="/diet-plans/new"
          element={
            <RoleRoute allowed={["coach"]}>
              <CreateDietPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/diet-plans/:id/edit"
          element={
            <RoleRoute allowed={["coach"]}>
              <EditDietPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/diet-plans/:id/assign"
          element={
            <RoleRoute allowed={["coach"]}>
              <AssignDietPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <RoleRoute allowed={["coach"]}>
              <AnalyticsPage />
            </RoleRoute>
          }
        />

        {/* Client Routes */}
        <Route
          path="/my-plan"
          element={
            <RoleRoute allowed={["client"]}>
              <MyPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/check-in"
          element={
            <RoleRoute allowed={["client"]}>
              <CheckInPage />
            </RoleRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <RoleRoute allowed={["client"]}>
              <ProgressPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ViewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
