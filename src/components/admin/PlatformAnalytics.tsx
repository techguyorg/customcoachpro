import { useNavigate } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, UserCheck, Shield, Handshake, Dumbbell, UtensilsCrossed, ChefHat, Apple, ArrowRight, TrendingUp, Activity, Calendar, Star } from "lucide-react";
import { format, subDays } from "date-fns";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";
import { AdminAnalyticsPdf } from "@/components/pdf/AdminAnalyticsPdf";

export function PlatformAnalytics() {
  const { data: stats, isLoading } = useAdminStats();
  const navigate = useNavigate();

  // Get additional analytics data
  const { data: recentActivity } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const data = await api.get<{
        newUsersWeek: number;
        checkinsMonth: number;
        workoutsMonth: number;
        topCoachClientCount: number;
      }>('/api/admin/recent-activity');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  // Prepare PDF data
  const pdfData = {
    generatedDate: new Date().toISOString(),
    userStats: {
      totalUsers: stats.totalUsers,
      totalAdmins: stats.totalAdmins,
      totalCoaches: stats.totalCoaches,
      totalClients: stats.totalClients,
    },
    engagementStats: {
      activeCoachings: stats.activeCoachings,
      pendingRequests: stats.pendingRequests,
    },
    contentStats: {
      exercises: stats.systemExercises,
      workoutTemplates: stats.systemWorkoutTemplates,
      dietPlans: stats.systemDietPlans,
      recipes: stats.systemRecipes,
      foods: stats.systemFoods,
    },
    activityStats: {
      newUsersWeek: recentActivity?.newUsersWeek || 0,
      checkinsMonth: recentActivity?.checkinsMonth || 0,
      workoutsMonth: recentActivity?.workoutsMonth || 0,
      topCoachClients: recentActivity?.topCoachClientCount || 0,
    },
    platformHealth: {
      coachToClientRatio: `1:${stats.totalCoaches > 0 ? Math.round(stats.totalClients / stats.totalCoaches) : 0}`,
      avgClientsPerCoach: stats.totalCoaches > 0 ? (stats.activeCoachings / stats.totalCoaches).toFixed(1) : "0",
      requestConversionRate: stats.activeCoachings > 0 && stats.pendingRequests >= 0
        ? `${Math.round((stats.activeCoachings / (stats.activeCoachings + stats.pendingRequests)) * 100)}%`
        : "N/A",
    },
  };

  return (
    <div className="space-y-4">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform Analytics</h2>
        <ExportPdfButton
          document={<AdminAnalyticsPdf data={pdfData} />}
          filename={`platform-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`}
          label="Export Report"
        />
      </div>

      {/* User Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">User Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="text-primary"
            onClick={() => navigate("/admin/users")}
          />
          <StatCard
            icon={Shield}
            label="Super Admins"
            value={stats.totalAdmins}
            color="text-red-500"
            onClick={() => navigate("/admin/super-admins")}
          />
          <StatCard
            icon={UserCheck}
            label="Coaches"
            value={stats.totalCoaches}
            color="text-blue-500"
            onClick={() => navigate("/admin/users?filter=coach")}
          />
          <StatCard
            icon={Users}
            label="Clients"
            value={stats.totalClients}
            color="text-green-500"
            onClick={() => navigate("/admin/users?filter=client")}
          />
        </div>
      </div>

      {/* Engagement Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Engagement</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Handshake}
            label="Active Relationships"
            value={stats.activeCoachings}
            color="text-purple-500"
            onClick={() => navigate("/admin/analytics/relationships")}
          />
          <StatCard
            icon={Users}
            label="Pending Requests"
            value={stats.pendingRequests}
            color="text-amber-500"
            onClick={() => navigate("/admin/analytics/requests")}
          />
        </div>
      </div>

      {/* Content Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">System Content</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <StatCard
            icon={Dumbbell}
            label="Exercises"
            value={stats.systemExercises}
            color="text-primary"
            compact
            onClick={() => navigate("/admin/content?tab=exercises")}
          />
          <StatCard
            icon={Dumbbell}
            label="Workout Templates"
            value={stats.systemWorkoutTemplates}
            color="text-primary"
            compact
            onClick={() => navigate("/admin/content?tab=workouts")}
          />
          <StatCard
            icon={UtensilsCrossed}
            label="Diet Plans"
            value={stats.systemDietPlans}
            color="text-primary"
            compact
            onClick={() => navigate("/admin/content?tab=diets")}
          />
          <StatCard
            icon={ChefHat}
            label="Recipes"
            value={stats.systemRecipes}
            color="text-primary"
            compact
            onClick={() => navigate("/admin/content?tab=recipes")}
          />
          <StatCard
            icon={Apple}
            label="Foods"
            value={stats.systemFoods}
            color="text-primary"
            compact
            onClick={() => navigate("/admin/content?tab=foods")}
          />
        </div>
      </div>

      {/* Activity Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Activity Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentActivity?.newUsersWeek || 0}</p>
                <p className="text-xs text-muted-foreground">New Users (7d)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentActivity?.checkinsMonth || 0}</p>
                <p className="text-xs text-muted-foreground">Check-ins (30d)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentActivity?.workoutsMonth || 0}</p>
                <p className="text-xs text-muted-foreground">Workouts Logged (30d)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentActivity?.topCoachClientCount || 0}</p>
                <p className="text-xs text-muted-foreground">Top Coach Clients</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>
            Summary of the CustomCoachPro platform status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Coach to Client Ratio</span>
              <span className="font-medium">
                1:{stats.totalCoaches > 0 ? Math.round(stats.totalClients / stats.totalCoaches) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Average Clients per Coach</span>
              <span className="font-medium">
                {stats.totalCoaches > 0 ? (stats.activeCoachings / stats.totalCoaches).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Request Conversion Rate</span>
              <span className="font-medium">
                {stats.activeCoachings > 0 && stats.pendingRequests >= 0
                  ? `${Math.round((stats.activeCoachings / (stats.activeCoachings + stats.pendingRequests)) * 100)}%`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">User Growth (7 days)</span>
              <span className="font-medium text-green-500">
                +{recentActivity?.newUsersWeek || 0} users
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Platform Engagement (30 days)</span>
              <span className="font-medium">
                {(recentActivity?.checkinsMonth || 0) + (recentActivity?.workoutsMonth || 0)} activities
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  compact?: boolean;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, color, compact, onClick }: StatCardProps) {
  return (
    <Card 
      className={`${compact ? "p-4" : ""} ${onClick ? "cursor-pointer hover:bg-muted/50 transition-colors group" : ""}`}
      onClick={onClick}
    >
      {compact ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
          {onClick && (
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      ) : (
        <>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                {label}
              </span>
              {onClick && (
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{value}</p>
          </CardContent>
        </>
      )}
    </Card>
  );
}
