import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useQuery } from "@tanstack/react-query";
import coachService from "@/services/coachService";
import { Progress } from "@/components/ui/progress";

type ClientRow = {
  id: string;
  email: string;
  displayName: string;
  startDate?: string;
  currentWeight?: number;
  targetWeight?: number;
  attentionReason?: string | null;
  averageDietCompliance?: number | null;
  activeWorkoutPlan?: {
    planId: string;
    name: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  } | null;
  activeDietPlan?: {
    planId: string;
    name: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  } | null;
};

export function ClientsPage() {
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["coach", "clients"],
    queryFn: () => coachService.getClients(),
  });

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const renderPlanChips = (client: ClientRow) => {
    const plans = [
      client.activeWorkoutPlan && { label: "Workout", name: client.activeWorkoutPlan.name },
      client.activeDietPlan && { label: "Diet", name: client.activeDietPlan.name },
    ].filter(Boolean) as { label: string; name: string }[];

    if (plans.length === 0) {
      return <span className="text-sm text-muted-foreground">No plans</span>;
    }

    return (
      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <div key={plan.label} className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              {plan.label}
            </Badge>
            <span className="text-sm text-foreground line-clamp-1">{plan.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderRenewal = (client: ClientRow) => {
    const entries = [
      client.activeWorkoutPlan && {
        label: "Workout",
        days: client.activeWorkoutPlan.daysRemaining ?? getDaysRemaining(client.activeWorkoutPlan.endDate),
      },
      client.activeDietPlan && {
        label: "Diet",
        days: client.activeDietPlan.daysRemaining ?? getDaysRemaining(client.activeDietPlan.endDate),
      },
    ].filter(Boolean) as { label: string; days: number | null | undefined }[];

    if (entries.length === 0) return <span className="text-sm text-muted-foreground">—</span>;

    return (
      <div className="flex flex-col gap-1 text-sm">
        {entries.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {item.label}
            </Badge>
            <span className="text-muted-foreground">{item.days ?? "—"}d</span>
          </div>
        ))}
      </div>
    );
  };

  const renderAttention = (client: ClientRow) => {
    if (!client.attentionReason) {
      return <Badge className="bg-icon-success/15 text-icon-success border-0">On Track</Badge>;
    }

    return (
      <div className="flex flex-col gap-2">
        <Badge className="bg-icon-warning/15 text-icon-warning border-0">Needs Attention</Badge>
        <p className="text-xs text-muted-foreground max-w-[220px] line-clamp-2">{client.attentionReason}</p>
      </div>
    );
  };

  const columns: Column<ClientRow>[] = [
    {
      key: "name",
      header: "Client",
      cell: (client) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {client.displayName?.[0]?.toUpperCase() ?? "C"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{client.displayName}</p>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "weight",
      header: "Progress",
      cell: (client) => {
        const cw = client.currentWeight ?? null;
        const tw = client.targetWeight ?? null;
        return (
          <div className="text-sm">
            <p className="font-medium">{cw !== null ? `${cw} lbs` : "—"}</p>
            <p className="text-muted-foreground">{tw !== null ? `Goal: ${tw} lbs` : "No goal"}</p>
          </div>
        );
      },
    },
    {
      key: "startDate",
      header: "Start Date",
      cell: (client) => (
        <span className="text-sm text-muted-foreground">
          {client.startDate ? new Date(client.startDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (client) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">{renderAttention(client)}</div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg diet compliance (last 3)</p>
            <div className="flex items-center gap-2">
              <Progress value={client.averageDietCompliance ?? 0} className="h-2 bg-muted" />
              <span className="text-xs font-medium text-foreground">
                {client.averageDietCompliance != null ? `${client.averageDietCompliance}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "plans",
      header: "Plan",
      cell: renderPlanChips,
    },
    {
      key: "renewal",
      header: "Renewal",
      cell: renderRenewal,
    },
    {
      key: "actions",
      header: "Quick Links",
      cell: (client) => (
        <div className="flex flex-col gap-2">
          <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate(`/clients/${client.id}`)}>
            View profile
          </Button>
          <Button
            variant="link"
            className="px-0 h-auto text-primary"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/clients/${client.id}/edit`);
            }}
          >
            Edit
          </Button>
        </div>
      ),
      className: "w-32",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        description="Manage your clients and track their progress."
        actions={
          <Button onClick={() => navigate("/clients/new")} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        }
      />

      <DataTable
        data={clients}
        columns={columns}
        searchPlaceholder="Search clients..."
        searchKey="displayName"
        onRowClick={(client) => navigate(`/clients/${client.id}`)}
        emptyMessage={isLoading ? "Loading..." : "No clients found. Add your first client to get started!"}
      />
    </div>
  );
}

export default ClientsPage;
