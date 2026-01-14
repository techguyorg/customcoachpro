import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Calendar, 
  Target, 
  Scale, 
  TrendingUp,
  MessageSquare,
  ClipboardList,
  Activity,
  AlertCircle,
  StickyNote
} from "lucide-react";
import { format } from "date-fns";
import type { CoachClient } from "@/hooks/useCoachClients";
import { ClientNotesTab } from "./ClientNotesTab";
import { AssignPlanDialog } from "./AssignPlanDialog";

interface ClientDetailSheetProps {
  client: CoachClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  active: { label: "Active", className: "bg-success/20 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/20 text-warning border-warning/30" },
  paused: { label: "Paused", className: "bg-muted text-muted-foreground border-border" },
  ended: { label: "Ended", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

export function ClientDetailSheet({ client, open, onOpenChange }: ClientDetailSheetProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!client) return null;

  const status = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.pending;
  const initials = client.profile?.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl p-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <SheetHeader className="text-left">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={client.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetTitle className="text-xl">
                      {client.profile?.full_name || "Unknown Client"}
                    </SheetTitle>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {client.profile?.email}
                    </p>
                    <Badge variant="outline" className={`mt-2 ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <ClipboardList className="w-4 h-4" />
                  Assign Plan
                </Button>
              </div>

              <Separator />

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="overview" className="gap-2">
                    <Activity className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <StickyNote className="w-4 h-4" />
                    Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-6">
                  {/* Client Stats */}
                  <div>
                    <h3 className="font-semibold mb-4">Client Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {client.started_at && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            Started
                          </div>
                          <p className="font-semibold">
                            {format(new Date(client.started_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      )}
                      
                      {client.client_profile?.fitness_level && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Activity className="w-4 h-4" />
                            Level
                          </div>
                          <p className="font-semibold capitalize">
                            {client.client_profile.fitness_level}
                          </p>
                        </div>
                      )}

                      {client.client_profile?.height_cm && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Scale className="w-4 h-4" />
                            Height
                          </div>
                          <p className="font-semibold">
                            {client.client_profile.height_cm} cm
                          </p>
                        </div>
                      )}

                      {client.client_profile?.current_weight_kg && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Scale className="w-4 h-4" />
                            Current Weight
                          </div>
                          <p className="font-semibold">
                            {client.client_profile.current_weight_kg} kg
                          </p>
                        </div>
                      )}

                      {client.client_profile?.target_weight_kg && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Target className="w-4 h-4" />
                            Target Weight
                          </div>
                          <p className="font-semibold">
                            {client.client_profile.target_weight_kg} kg
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dietary Restrictions */}
                  {client.client_profile?.dietary_restrictions && client.client_profile.dietary_restrictions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-warning" />
                        Dietary Restrictions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {client.client_profile.dietary_restrictions.map((restriction, i) => (
                          <Badge key={i} variant="outline" className="text-warning border-warning/30">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical Conditions */}
                  {client.client_profile?.medical_conditions && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        Medical Conditions
                      </h3>
                      <p className="text-sm bg-destructive/10 text-destructive rounded-lg p-3">
                        {client.client_profile.medical_conditions}
                      </p>
                    </div>
                  )}

                  {/* Fitness Goals */}
                  {client.client_profile?.fitness_goals && client.client_profile.fitness_goals.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Fitness Goals
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {client.client_profile.fitness_goals.map((goal, i) => (
                          <Badge key={i} variant="secondary">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes from relationship */}
                  {client.notes && (
                    <div>
                      <h3 className="font-semibold mb-3">Relationship Notes</h3>
                      <p className="text-muted-foreground text-sm bg-muted/30 rounded-lg p-3">
                        {client.notes}
                      </p>
                    </div>
                  )}

                  {/* Subscription Status */}
                  {client.client_profile?.subscription_status && (
                    <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Subscription Status</p>
                        <p className="text-muted-foreground text-sm capitalize">
                          {client.client_profile.subscription_status}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="progress" className="mt-4">
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Progress Tracking</h3>
                    <p className="text-muted-foreground text-sm">
                      View {client.profile?.full_name?.split(' ')[0]}'s measurements, photos, and goal progress here.
                    </p>
                    <Button className="mt-4" variant="outline">
                      View Full Progress
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <ClientNotesTab 
                    clientId={client.client_id} 
                    clientName={client.profile?.full_name || "Client"} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Assign Plan Dialog */}
      <AssignPlanDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        clientId={client.client_id}
        clientName={client.profile?.full_name || "Client"}
      />
    </>
  );
}