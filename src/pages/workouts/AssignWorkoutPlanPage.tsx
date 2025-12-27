import { useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import coachService from "@/services/coachService";
import workoutPlanService from "@/services/workoutPlanService";

export function AssignWorkoutPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [durationDays, setDurationDays] = useState("");

  const { data: plan } = useQuery({
    queryKey: ["workout-plan", id],
    queryFn: () => workoutPlanService.get(id!),
    enabled: Boolean(id),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["coach", "clients"],
    queryFn: () => coachService.getClients(),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      workoutPlanService.assign({
        clientId: selectedClientId,
        workoutPlanId: id!,
        startDate: new Date(startDate).toISOString(),
        durationDays: durationDays ? Number(durationDays) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Workout plan assigned" });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      navigate("/workout-plans");
    },
    onError: (error) => {
      toast({
        title: "Unable to assign plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!id) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast({
        title: "Select a client",
        description: "Choose a client to assign this plan.",
      });
      return;
    }
    assignMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workout-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">Assign workout plan</h1>
          <p className="text-muted-foreground">
            Choose a client and start date for {plan?.name ?? "this plan"}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment details</CardTitle>
          <CardDescription>Assign the plan to an active client.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <select
                  id="client"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.displayName || client.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                placeholder="Optional"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Set how long the plan should run. Leave blank for open-ended.</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/workout-plans")}>
                Cancel
              </Button>
              <Button type="submit" className="shadow-energy" disabled={assignMutation.isPending}>
                {assignMutation.isPending ? "Assigning..." : "Assign plan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssignWorkoutPlanPage;
