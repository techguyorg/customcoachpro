import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  MessageSquare, 
  TrendingUp, 
  Target,
  Calendar,
  Play,
  Pause,
  UserX,
  Eye,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import type { CoachClient } from "@/hooks/useCoachClients";

interface ClientCardProps {
  client: CoachClient;
  onStatusChange: (relationshipId: string, status: string) => void;
  onViewDetails: (client: CoachClient) => void;
  onAssignPlan?: (client: CoachClient) => void;
  onMessage?: (client: CoachClient) => void;
}

const statusConfig = {
  active: { label: "Active", className: "bg-success/20 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/20 text-warning border-warning/30" },
  paused: { label: "Paused", className: "bg-muted text-muted-foreground border-border" },
  ended: { label: "Ended", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const fitnessLevelConfig: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate", 
  advanced: "Advanced",
};

export function ClientCard({ client, onStatusChange, onViewDetails, onAssignPlan, onMessage }: ClientCardProps) {
  const status = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.pending;
  const initials = client.profile?.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "?";

  const weightProgress = client.client_profile?.current_weight_kg && client.client_profile?.target_weight_kg
    ? Math.abs(
        ((client.client_profile.current_weight_kg - client.client_profile.target_weight_kg) /
          client.client_profile.target_weight_kg) *
          100
      ).toFixed(1)
    : null;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={client.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">
                  {client.profile?.full_name || "Unknown Client"}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {client.profile?.email}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(client)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {client.status === "active" && onAssignPlan && (
                      <DropdownMenuItem onClick={() => onAssignPlan(client)}>
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Assign Plan
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onMessage?.(client)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Progress
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {client.status === "pending" && (
                      <DropdownMenuItem onClick={() => onStatusChange(client.id, "active")}>
                        <Play className="w-4 h-4 mr-2" />
                        Accept Client
                      </DropdownMenuItem>
                    )}
                    {client.status === "active" && (
                      <DropdownMenuItem onClick={() => onStatusChange(client.id, "paused")}>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Coaching
                      </DropdownMenuItem>
                    )}
                    {client.status === "paused" && (
                      <DropdownMenuItem onClick={() => onStatusChange(client.id, "active")}>
                        <Play className="w-4 h-4 mr-2" />
                        Resume Coaching
                      </DropdownMenuItem>
                    )}
                    {client.status !== "ended" && (
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => onStatusChange(client.id, "ended")}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        End Relationship
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              {client.client_profile?.fitness_level && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Target className="w-3.5 h-3.5" />
                  <span>{fitnessLevelConfig[client.client_profile.fitness_level] || client.client_profile.fitness_level}</span>
                </div>
              )}
              
              {client.started_at && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Since {format(new Date(client.started_at), "MMM yyyy")}</span>
                </div>
              )}

              {weightProgress && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{weightProgress}% to goal</span>
                </div>
              )}
            </div>

            {/* Goals */}
            {client.client_profile?.fitness_goals && Array.isArray(client.client_profile.fitness_goals) && client.client_profile.fitness_goals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {client.client_profile.fitness_goals.slice(0, 3).map((goal, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {goal}
                  </Badge>
                ))}
                {client.client_profile.fitness_goals.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{client.client_profile.fitness_goals.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}