import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Users, CalendarCheck, Target, Activity, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Client {
  relationshipId: string;
  status: string;
  started_at: string | null;
  profile: {
    full_name: string;
    email: string;
  } | null;
}

interface Checkin {
  id: string;
  status: string;
  checkin_date: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  client_id: string;
  profiles?: {
    full_name: string;
  };
}

interface Assignment {
  id: string;
  plan_type: string;
  status: string;
  start_date: string;
  client_id: string;
  workout_template?: { name: string } | null;
  diet_plan?: { name: string } | null;
  profiles?: { full_name: string };
}

type ModalType = 
  | "total-clients" 
  | "active-clients" 
  | "pending-checkins" 
  | "active-plans"
  | "checkin-status"
  | "plan-assignments"
  | "client-distribution";

interface AnalyticsDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ModalType;
  clients?: Client[];
  checkins?: Checkin[];
  assignments?: Assignment[];
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  paused: "bg-muted text-muted-foreground",
  submitted: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground",
};

export function AnalyticsDetailModal({
  open,
  onOpenChange,
  type,
  clients = [],
  checkins = [],
  assignments = [],
}: AnalyticsDetailModalProps) {
  const navigate = useNavigate();

  const getTitle = () => {
    switch (type) {
      case "total-clients": return "All Clients";
      case "active-clients": return "Active Clients";
      case "pending-checkins": return "Pending Check-ins";
      case "active-plans": return "Active Plans";
      case "checkin-status": return "Check-in Status";
      case "plan-assignments": return "Plan Assignments";
      case "client-distribution": return "Client Distribution";
      default: return "Details";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "total-clients":
      case "client-distribution": return <Users className="w-5 h-5" />;
      case "active-clients": return <Activity className="w-5 h-5" />;
      case "pending-checkins":
      case "checkin-status": return <CalendarCheck className="w-5 h-5" />;
      case "active-plans":
      case "plan-assignments": return <Target className="w-5 h-5" />;
      default: return null;
    }
  };

  const renderClientList = (clientList: Client[]) => (
    <div className="space-y-2">
      {clientList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No clients found</p>
      ) : (
        clientList.map((client) => (
          <div
            key={client.relationshipId}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{client.profile?.full_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{client.profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {client.started_at && (
                <span className="text-xs text-muted-foreground">
                  Since {format(new Date(client.started_at), "MMM d, yyyy")}
                </span>
              )}
              <Badge variant="outline" className={statusColors[client.status] || ""}>
                {client.status}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCheckinList = (checkinList: Checkin[], showReviewButton = false) => (
    <div className="space-y-2">
      {checkinList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No check-ins found</p>
      ) : (
        checkinList.map((checkin) => (
          <div
            key={checkin.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{checkin.profiles?.full_name || "Unknown Client"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(checkin.checkin_date), "MMM d, yyyy")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors[checkin.status] || ""}>
                {checkin.status}
              </Badge>
              {showReviewButton && checkin.status === "submitted" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/coach/checkins");
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Review
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAssignmentList = (assignmentList: Assignment[]) => (
    <div className="space-y-2">
      {assignmentList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No assignments found</p>
      ) : (
        assignmentList.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">
                {assignment.workout_template?.name || assignment.diet_plan?.name || "Unnamed Plan"}
              </p>
              <p className="text-xs text-muted-foreground">
                {assignment.profiles?.full_name || "Unknown Client"} • Started {format(new Date(assignment.start_date), "MMM d")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {assignment.plan_type}
              </Badge>
              <Badge variant="outline" className={statusColors[assignment.status] || ""}>
                {assignment.status}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case "total-clients":
      case "client-distribution":
        return (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All ({clients.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({clients.filter(c => c.status === "active").length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({clients.filter(c => c.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({clients.filter(c => c.status === "paused").length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderClientList(clients)}
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              {renderClientList(clients.filter(c => c.status === "active"))}
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              {renderClientList(clients.filter(c => c.status === "pending"))}
            </TabsContent>
            <TabsContent value="paused" className="mt-4">
              {renderClientList(clients.filter(c => c.status === "paused"))}
            </TabsContent>
          </Tabs>
        );

      case "active-clients":
        return renderClientList(clients.filter(c => c.status === "active"));

      case "pending-checkins":
        return renderCheckinList(
          checkins.filter(c => c.status === "submitted"),
          true
        );

      case "checkin-status":
        return (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="pending">Pending ({checkins.filter(c => c.status === "submitted").length})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({checkins.filter(c => c.status === "reviewed").length})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({checkins.filter(c => c.status === "draft").length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              {renderCheckinList(checkins.filter(c => c.status === "submitted"), true)}
            </TabsContent>
            <TabsContent value="reviewed" className="mt-4">
              {renderCheckinList(checkins.filter(c => c.status === "reviewed"))}
            </TabsContent>
            <TabsContent value="draft" className="mt-4">
              {renderCheckinList(checkins.filter(c => c.status === "draft"))}
            </TabsContent>
          </Tabs>
        );

      case "active-plans":
        return renderAssignmentList(assignments.filter(a => a.status === "active"));

      case "plan-assignments":
        return (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
              <TabsTrigger value="workout">Workout ({assignments.filter(a => a.plan_type === "workout").length})</TabsTrigger>
              <TabsTrigger value="diet">Diet ({assignments.filter(a => a.plan_type === "diet").length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderAssignmentList(assignments)}
            </TabsContent>
            <TabsContent value="workout" className="mt-4">
              {renderAssignmentList(assignments.filter(a => a.plan_type === "workout"))}
            </TabsContent>
            <TabsContent value="diet" className="mt-4">
              {renderAssignmentList(assignments.filter(a => a.plan_type === "diet"))}
            </TabsContent>
          </Tabs>
        );

      default:
        return <p className="text-muted-foreground">No data available</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
