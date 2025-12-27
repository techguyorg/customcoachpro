import {
  Users,
  ClipboardCheck,
  Dumbbell,
  Utensils,
  TrendingUp,
  Plus,
  AlertTriangle,
  CalendarClock,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import dashboardService from "@/services/dashboardService";
import coachService from "@/services/coachService";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["dashboard", "coach"],
    queryFn: () => dashboardService.getCoachStats(),
  });

  const {
    data: clients,
    isLoading: clientsLoading,
    isError: clientsError,
  } = useQuery({
    queryKey: ["coach", "clients", "recent"],
    queryFn: () => coachService.getClients(),
  });

  const name = user?.displayName || user?.firstName || "Coach";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-icon-success/15 text-icon-success border-0">On Track</Badge>;
      case "needs-attention":
        return <Badge className="bg-icon-warning/15 text-icon-warning border-0">Needs Attention</Badge>;
      case "behind":
        return <Badge className="bg-destructive/20 text-destructive border-0">Behind</Badge>;
      default:
        return null;
    }
  };

  // Keep demo widgets but use real client list as "recent"
  const recentClients = (clients ?? []).slice(0, 4).map((c) => ({
    id: c.id,
    displayName: c.displayName,
    avatarUrl: "",
    lastCheckIn: "—",
    status: c.attentionReason ? "needs-attention" : "on-track",
    attentionReason: c.attentionReason,
  }));

  const pendingCheckIns = [
    { id: "1", clientName: "—", type: "Weight", date: "—" },
    { id: "2", clientName: "—", type: "Workout", date: "—" },
  ];

  const attentionItems = stats?.attentionItems ?? [];
  const upcomingRenewals = stats?.upcomingRenewals ?? [];
  const complianceTrend = stats?.complianceTrend;

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients ?? 0,
      subtitle: `${stats?.activeClients ?? 0} active`,
      icon: Users,
      variant: "primary" as const,
      iconTone: "brand" as const,
    },
    {
      title: "Pending Check-ins",
      value: stats?.pendingCheckIns ?? 0,
      subtitle: "Awaiting review",
      icon: ClipboardCheck,
      variant: "secondary" as const,
      iconTone: "warning" as const,
    },
    {
      title: "Workout Plans",
      value: stats?.workoutPlansCreated ?? 0,
      subtitle: "Created",
      icon: Dumbbell,
      variant: "accent" as const,
      iconTone: "workout" as const,
    },
    {
      title: "Diet Plans",
      value: stats?.dietPlansCreated ?? 0,
      subtitle: "Created",
      icon: Utensils,
      variant: "default" as const,
      iconTone: "diet" as const,
    },
  ];

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  };

  const formatRelativeTime = (value?: string) => {
    if (!value) return "—";
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${name}!`}
        description="Here's what's happening with your clients today."
        actions={
          <Button onClick={() => navigate("/clients/new")} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: statCards.length }).map((_, idx) => (
              <Skeleton key={idx} className="h-32 w-full rounded-xl" />
            ))
          : statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                variant={card.variant}
                iconTone={card.iconTone}
              />
            ))}
      </div>
      {statsError && (
        <p className="text-sm text-destructive">Unable to load dashboard stats right now.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Clients</CardTitle>
              <CardDescription>Your assigned clients</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/clients")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : clientsError ? (
                <p className="text-sm text-destructive">Unable to load clients right now.</p>
              ) : recentClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients assigned yet.</p>
              ) : (
                recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={client.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {client.displayName?.[0]?.toUpperCase() ?? "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{client.displayName}</p>
                        <p className="text-sm text-muted-foreground">Last check-in: {client.lastCheckIn}</p>
                      </div>
                    </div>
                    {client.attentionReason ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{getStatusBadge(client.status)}</TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">{client.attentionReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      getStatusBadge(client.status)
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Check-ins</CardTitle>
              <CardDescription>Next iteration (Sprint 3)</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/check-ins")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-icon-warning/10 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5 text-icon-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{checkIn.clientName}</p>
                      <p className="text-sm text-muted-foreground">{checkIn.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{checkIn.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Insights</CardTitle>
              <CardDescription>High-priority items and renewals</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : statsError ? (
              <p className="text-sm text-destructive">Unable to load insights right now.</p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-energy" />
                      <p className="text-sm font-semibold text-foreground">Needs attention</p>
                    </div>
                    <Badge variant="outline">{attentionItems.length}</Badge>
                  </div>
                  {attentionItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No urgent client items.</p>
                  ) : (
                    <div className="space-y-2">
                      {attentionItems.map((item) => (
                        <div
                          key={`${item.clientId}-${item.submittedAt}-${item.type}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/clients/${item.clientId}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-energy/10 flex items-center justify-center">
                              <ClipboardCheck className="h-5 w-5 text-energy" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.clientName}</p>
                              <p className="text-sm text-muted-foreground">{item.summary}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(item.submittedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Upcoming renewals</p>
                  </div>
                  {upcomingRenewals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No renewals in the next few weeks.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingRenewals.map((item) => (
                        <div
                          key={`${item.planType}-${item.planId}-${item.renewalDate}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(
                              item.planType === "workout"
                                ? `/workout-plans/${item.planId}/edit`
                                : `/diet-plans/${item.planId}/edit`,
                            )
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <LineChart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {item.planName} · {item.clientName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Renews {formatDate(item.renewalDate)} • {item.planType === "workout" ? "Workout" : "Nutrition"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{item.daysRemaining}d</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <p className="text-sm font-semibold text-foreground">Compliance trend</p>
                  </div>
                  {complianceTrend ? (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average diet compliance</p>
                        <p className="text-2xl font-semibold text-foreground">
                          {Math.round(complianceTrend.average)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Based on {complianceTrend.sampleSize} recent check-ins
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          complianceTrend.change >= 0 ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {complianceTrend.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Math.abs(complianceTrend.change)}%
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No compliance data yet.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/clients/new")}
            >
              <Users className="h-6 w-6 text-icon-brand" />
              <span>Add New Client</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/workout-plans")}
            >
              <Dumbbell className="h-6 w-6 text-icon-workout" />
              <span>Workout Plans</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/diet-plans")}
            >
              <Utensils className="h-6 w-6 text-icon-diet" />
              <span>Diet Plans</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/analytics")}
            >
              <TrendingUp className="h-6 w-6 text-icon-analytics" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachDashboard;
