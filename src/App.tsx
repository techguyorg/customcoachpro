import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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
import { DietPlansPage } from "@/pages/diet/DietPlansPage";
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";

// Client Pages
import { MyPlanPage } from "@/pages/client/MyPlanPage";
import { CheckInPage } from "@/pages/client/CheckInPage";
import { ProgressPage } from "@/pages/client/ProgressPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Shared */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Coach Routes */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<NewClientPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/check-ins" element={<CheckInsPage />} />
        <Route path="/workout-plans" element={<WorkoutPlansPage />} />
        <Route path="/diet-plans" element={<DietPlansPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        
        {/* Client Routes */}
        <Route path="/my-plan" element={<MyPlanPage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
