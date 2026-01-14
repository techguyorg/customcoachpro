import { useState } from "react";
import { BarChart3, Users, CalendarCheck, Target, Activity, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachClients, useClientStats } from "@/hooks/useCoachClients";
import { useCoachCheckins } from "@/hooks/useCheckins";
import { useCoachAssignments } from "@/hooks/usePlanAssignments";
import { useCoachAnalytics } from "@/hooks/useCoachAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsDetailModal } from "@/components/coach/AnalyticsDetailModal";
import { ClientLeaderboard, calculateClientEngagement } from "@/components/coach/ClientLeaderboard";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";
import { CoachAnalyticsPdf } from "@/components/pdf/CoachAnalyticsPdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

type ModalType = 
  | "total-clients" 
  | "active-clients" 
  | "pending-checkins" 
  | "active-plans"
  | "checkin-status"
  | "plan-assignments"
  | "client-distribution";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("total-clients");

  const { data: clients, isLoading: loadingClients } = useCoachClients();
  const stats = useClientStats();
  const { data: checkins, isLoading: loadingCheckins } = useCoachCheckins();
  const { data: assignments, isLoading: loadingAssignments } = useCoachAssignments();

  // Calculate quick metrics
  const analytics = useCoachAnalytics(
    clients?.map(c => ({
      relationshipId: c.id,
      status: c.status,
      started_at: c.started_at,
      ended_at: c.ended_at,
    })) || [],
    checkins?.map(c => ({
      id: c.id,
      status: c.status,
      submitted_at: c.submitted_at,
      reviewed_at: c.reviewed_at,
      diet_adherence: c.diet_adherence,
      workout_adherence: c.workout_adherence,
      client_id: c.client_id,
    })) || []
  );

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalOpen(true);
  };

  // Client distribution data for pie chart
  const clientDistribution = [
    { name: "Active", value: stats.active, color: COLORS[0] },
    { name: "Pending", value: stats.pending, color: COLORS[1] },
    { name: "Paused", value: stats.paused, color: COLORS[2] },
  ].filter(d => d.value > 0);

  // Check-ins by status
  const checkinStats = {
    pending: checkins?.filter(c => c.status === "submitted").length || 0,
    reviewed: checkins?.filter(c => c.status === "reviewed").length || 0,
    draft: checkins?.filter(c => c.status === "draft").length || 0,
  };

  // Weekly activity (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const weeklyActivity = last7Days.map(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayCheckins = checkins?.filter(c => 
      format(new Date(c.created_at), "yyyy-MM-dd") === dayStr
    ).length || 0;
    
    return {
      day: format(day, "EEE"),
      checkins: dayCheckins,
    };
  });

  // Plan assignments by type
  const assignmentsByType = {
    workout: assignments?.filter(a => a.plan_type === "workout").length || 0,
    diet: assignments?.filter(a => a.plan_type === "diet").length || 0,
    total: assignments?.length || 0,
  };

  const isLoading = loadingClients || loadingCheckins || loadingAssignments;

  // Create a map of client_id to profile names
  const clientNameMap = new Map(
    clients?.map(c => [c.client_id, c.profile?.full_name || "Unknown Client"]) || []
  );

  // Prepare modal data
  const modalClients = clients?.map(c => ({
    relationshipId: c.id,
    status: c.status,
    started_at: c.started_at,
    profile: c.profile,
  })) || [];

  const modalCheckins = checkins?.map(c => ({
    id: c.id,
    status: c.status,
    checkin_date: c.checkin_date,
    submitted_at: c.submitted_at,
    reviewed_at: c.reviewed_at,
    client_id: c.client_id,
    profiles: { full_name: clientNameMap.get(c.client_id) || "Unknown Client" },
  })) || [];

  const modalAssignments = assignments?.map(a => ({
    id: a.id,
    plan_type: a.plan_type,
    status: a.status,
    start_date: a.start_date,
    client_id: a.client_id,
    workout_template: a.workout_template,
    diet_plan: a.diet_plan,
    profiles: { full_name: clientNameMap.get(a.client_id) || "Unknown Client" },
  })) || [];

  // Prepare leaderboard data
  const leaderboardClients = clients?.map(c => ({
    id: c.client_id,
    name: c.profile?.full_name || "Unknown",
    status: c.status,
  })) || [];

  const leaderboardCheckins = checkins?.map(c => ({
    client_id: c.client_id,
    diet_adherence: c.diet_adherence,
    workout_adherence: c.workout_adherence,
    submitted_at: c.submitted_at,
  })) || [];

  // Calculate engagement for PDF
  const engagementData = calculateClientEngagement(leaderboardClients, leaderboardCheckins);

  // Prepare PDF data
  const pdfData = {
    coachName: user?.fullName || "Coach",
    generatedDate: new Date().toISOString(),
    stats: {
      totalClients: stats.total,
      activeClients: stats.active,
      pendingCheckins: checkinStats.pending,
      activePlans: assignments?.filter(a => a.status === "active").length || 0,
    },
    quickMetrics: {
      avgResponseTime: analytics.avgResponseTime,
      checkinRate: analytics.checkinRate,
      clientRetention: analytics.clientRetention,
    },
    checkinStats,
    assignmentStats: assignmentsByType,
    leaderboard: engagementData.slice(0, 10).map(e => ({
      name: e.name,
      score: e.score,
      adherence: e.adherenceScore,
      consistency: e.consistencyScore,
      goalsCompleted: e.goalsCompleted,
    })),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your coaching business performance
          </p>
        </div>
        <ExportPdfButton
          document={<CoachAnalyticsPdf data={pdfData} />}
          filename={`coach-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`}
          label="Export Report"
        />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card 
          className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={() => openModal("total-clients")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Clients</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-6 h-6 text-primary/50" />
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={() => openModal("active-clients")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Clients</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-success">{stats.active}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-6 h-6 text-success/50" />
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={() => openModal("pending-checkins")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Check-ins</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-warning">{checkinStats.pending}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <CalendarCheck className="w-6 h-6 text-warning/50" />
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
          onClick={() => openModal("active-plans")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Plans</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{assignments?.filter(a => a.status === "active").length || 0}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-6 h-6 text-primary/50" />
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client Distribution */}
        <Card 
          className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
          onClick={() => openModal("client-distribution")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : clientDistribution.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {clientDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No client data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Check-in Activity</CardTitle>
            <CardDescription className="text-xs">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="checkins" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client Leaderboard */}
        <ClientLeaderboard 
          clients={leaderboardClients}
          checkins={leaderboardCheckins}
        />

        {/* Stats Column */}
        <div className="space-y-4">
          {/* Check-in Status Breakdown */}
          <Card 
            className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
            onClick={() => openModal("checkin-status")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Check-in Status
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Pending Review</span>
                <span className="text-sm font-semibold text-warning">{checkinStats.pending}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Reviewed</span>
                <span className="text-sm font-semibold text-success">{checkinStats.reviewed}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Draft</span>
                <span className="text-sm font-semibold">{checkinStats.draft}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Avg. Response Time</span>
                <span className="text-sm font-semibold">{analytics.avgResponseTime}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Check-in Rate (7d)</span>
                <span className="text-sm font-semibold">{analytics.checkinRate}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">Avg. Retention</span>
                <span className="text-sm font-semibold">{analytics.clientRetention}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Assignments Row */}
      <Card 
        className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
        onClick={() => openModal("plan-assignments")}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            Plan Assignments
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{assignmentsByType.workout}</p>
              <p className="text-xs text-muted-foreground">Workout Plans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{assignmentsByType.diet}</p>
              <p className="text-xs text-muted-foreground">Diet Plans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{assignmentsByType.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <AnalyticsDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        clients={modalClients}
        checkins={modalCheckins}
        assignments={modalAssignments}
      />
    </div>
  );
}
