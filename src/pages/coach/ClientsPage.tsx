import { useState } from "react";
import { useCoachClients, useUpdateClientStatus, useClientStats, type CoachClient } from "@/hooks/useCoachClients";
import { ClientCard } from "@/components/coach/ClientCard";
import { InviteClientDialog } from "@/components/coach/InviteClientDialog";
import { ClientDetailSheet } from "@/components/coach/ClientDetailSheet";
import { AssignPlanDialog } from "@/components/coach/AssignPlanDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, UserPlus, UserCheck, Clock, Pause } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<CoachClient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [assignPlanClient, setAssignPlanClient] = useState<CoachClient | null>(null);

  const { data: clients, isLoading, error } = useCoachClients();
  const updateStatus = useUpdateClientStatus();
  const stats = useClientStats();

  const handleStatusChange = async (relationshipId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ relationshipId, status });
      toast.success(`Client status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update client status");
    }
  };

  const handleViewDetails = (client: CoachClient) => {
    setSelectedClient(client);
    setSheetOpen(true);
  };

  const handleAssignPlan = (client: CoachClient) => {
    setAssignPlanClient(client);
  };

  const handleMessage = (client: CoachClient) => {
    navigate("/coach/messages");
  };

  // Filter clients
  const filteredClients = clients?.filter(client => {
    const matchesSearch = 
      client.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      client.profile?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesTab = 
      activeTab === "all" || 
      client.status === activeTab;

    return matchesSearch && matchesTab;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            My Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your coaching relationships and client progress
          </p>
        </div>
        <InviteClientDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Total Clients</p>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Active</p>
            <UserCheck className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-bold mt-1 text-success">{stats.active}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pending</p>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-bold mt-1 text-warning">{stats.pending}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Paused</p>
            <Pause className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold mt-1">{stats.paused}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load clients. Please try again.</p>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
              onAssignPlan={handleAssignPlan}
              onMessage={handleMessage}
            />
          ))}
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No clients found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No clients yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Start growing your coaching business by inviting your first client
          </p>
          <InviteClientDialog />
        </div>
      )}

      {/* Client Detail Sheet */}
      <ClientDetailSheet
        client={selectedClient}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Assign Plan Dialog */}
      <AssignPlanDialog
        open={!!assignPlanClient}
        onOpenChange={(open) => !open && setAssignPlanClient(null)}
        clientId={assignPlanClient?.client_id || ""}
        clientName={assignPlanClient?.profile?.full_name || "Client"}
      />
    </div>
  );
}
