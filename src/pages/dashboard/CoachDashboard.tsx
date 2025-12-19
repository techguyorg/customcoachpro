import { Users, ClipboardCheck, Dumbbell, Utensils, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import dashboardService from "@/services/dashboardService";
import coachService from "@/services/coachService";

export function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard", "coach"],
    queryFn: () => dashboardService.getCoachStats(),
  });

  const { data: clients } = useQuery({
    queryKey: ["coach", "clients", "recent"],
    queryFn: () => coachService.getClients(),
  });

  const name = user?.displayName || user?.firstName || "Coach";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-vitality/20 text-vitality border-0">On Track</Badge>;
      case "needs-attention":
        return <Badge className="bg-energy/20 text-energy border-0">Needs Attention</Badge>;
      case "behind":
        return <Badge className="bg-destructive/20 text-destructive border-0">Behind</Badge>;
      default:
        return null;
    }
  };

  // Keep demo widgets but use real client list as "recent"
  const recentClients = (clients ?? []).slice(0, 4).map((c, idx) => ({
    id: c.id,
    displayName: c.displayName,
    avatarUrl: "",
    lastCheckIn: "—",
    status: idx % 3 === 0 ? "needs-attention" : "on-track",
  }));

  const pendingCheckIns = [
    { id: "1", clientName: "—", type: "Weight", date: "—" },
    { id: "2", clientName: "—", type: "Workout", date: "—" },
  ];

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
        <StatCard
          title="Total Clients"
          value={stats?.totalClients ?? 0}
          subtitle={`${stats?.activeClients ?? 0} active`}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Pending Check-ins"
          value={stats?.pendingCheckIns ?? 0}
          subtitle="Awaiting review"
          icon={ClipboardCheck}
          variant="secondary"
        />
        <StatCard
          title="Workout Plans"
          value={stats?.workoutPlansCreated ?? 0}
          subtitle="Created"
          icon={Dumbbell}
          variant="accent"
        />
        <StatCard
          title="Diet Plans"
          value={stats?.dietPlansCreated ?? 0}
          subtitle="Created"
          icon={Utensils}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              {recentClients.length === 0 ? (
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
                    {getStatusBadge(client.status)}
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
                    <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5 text-secondary" />
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
              <Users className="h-6 w-6 text-primary" />
              <span>Add New Client</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/workout-plans")}
            >
              <Dumbbell className="h-6 w-6 text-secondary" />
              <span>Workout Plans</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/diet-plans")}
            >
              <Utensils className="h-6 w-6 text-accent" />
              <span>Diet Plans</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/analytics")}
            >
              <TrendingUp className="h-6 w-6 text-energy" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachDashboard;
