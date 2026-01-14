import { useState } from "react";
import { 
  ClipboardCheck, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  Star,
  Loader2,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachCheckins, usePendingCheckins, type ClientCheckin } from "@/hooks/useCheckins";
import { useCoachClients } from "@/hooks/useCoachClients";
import { CheckinReviewSheet } from "@/components/coach/CheckinReviewSheet";
import { format, formatDistanceToNow } from "date-fns";

export default function CoachCheckinsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCheckin, setSelectedCheckin] = useState<ClientCheckin | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: checkins = [], isLoading } = useCoachCheckins();
  const { data: clients = [] } = useCoachClients();
  const pendingCheckins = usePendingCheckins();

  // Create a map of client IDs to client data
  const clientMap = new Map(clients.map(c => [c.client_id, c]));

  // Filter checkins
  const filteredCheckins = checkins.filter(checkin => {
    const client = clientMap.get(checkin.client_id);
    const matchesSearch = !search || 
      client?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      client?.profile?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "pending" && checkin.status === "submitted") ||
      (activeTab === "reviewed" && checkin.status === "reviewed");

    return matchesSearch && matchesTab;
  });

  const handleViewCheckin = (checkin: ClientCheckin) => {
    setSelectedCheckin(checkin);
    setSheetOpen(true);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "submitted":
        return { label: "Pending Review", className: "bg-warning/20 text-warning border-warning/30", icon: Clock };
      case "reviewed":
        return { label: "Reviewed", className: "bg-success/20 text-success border-success/30", icon: CheckCircle2 };
      case "acknowledged":
        return { label: "Acknowledged", className: "bg-primary/20 text-primary border-primary/30", icon: CheckCircle2 };
      default:
        return { label: status, className: "", icon: Clock };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            Client Check-ins
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and respond to your clients' progress updates
          </p>
        </div>
        {pendingCheckins.length > 0 && (
          <Badge variant="destructive" className="self-start">
            {pendingCheckins.length} pending review
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold mt-2">{pendingCheckins.length}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {checkins.filter(c => c.status === "reviewed").length}
            </p>
            <p className="text-xs text-muted-foreground">Reviewed This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">{checkins.length}</p>
            <p className="text-xs text-muted-foreground">Total Check-ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold mt-2">
              {(checkins.filter(c => c.coach_rating).reduce((acc, c) => acc + (c.coach_rating || 0), 0) / 
                (checkins.filter(c => c.coach_rating).length || 1)).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Avg Rating Given</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pendingCheckins.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCheckins.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Check-in List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filteredCheckins.length > 0 ? (
        <div className="space-y-4">
          {filteredCheckins.map((checkin) => {
            const client = clientMap.get(checkin.client_id);
            const statusConfig = getStatusConfig(checkin.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card 
                key={checkin.id} 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  checkin.status === 'submitted' ? 'border-warning/30 bg-warning/5' : ''
                }`}
                onClick={() => handleViewCheckin(checkin)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={client?.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {client?.profile?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {client?.profile?.full_name || "Unknown Client"}
                        </p>
                        <Badge variant="outline" className={statusConfig.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Check-in for {format(new Date(checkin.checkin_date), "MMMM d, yyyy")}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {checkin.diet_adherence && (
                          <span>Diet: {checkin.diet_adherence}/10</span>
                        )}
                        {checkin.workout_adherence && (
                          <span>Workout: {checkin.workout_adherence}/10</span>
                        )}
                        {checkin.submitted_at && (
                          <span>Submitted {formatDistanceToNow(new Date(checkin.submitted_at), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No check-ins found</h3>
            <p className="text-muted-foreground mt-1">
              {activeTab === "pending" 
                ? "All caught up! No pending check-ins to review."
                : "Check-ins from your clients will appear here."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Sheet */}
      <CheckinReviewSheet
        checkin={selectedCheckin}
        client={selectedCheckin ? clientMap.get(selectedCheckin.client_id) || null : null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
