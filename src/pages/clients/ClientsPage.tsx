import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useQuery } from "@tanstack/react-query";
import coachService from "@/services/coachService";

type ClientRow = {
  id: string;
  email: string;
  displayName: string;
  startDate?: string;
  currentWeight?: number;
  targetWeight?: number;
  attentionReason?: string | null;
};

export function ClientsPage() {
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["coach", "clients"],
    queryFn: () => coachService.getClients(),
  });

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
        <div className="flex items-center gap-2">
          <Badge className="bg-vitality/20 text-vitality border-0">Active</Badge>
          {client.attentionReason && (
            <Badge variant="secondary" className="bg-energy/20 text-energy border-0">
              {client.attentionReason}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>View Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>Edit Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
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
