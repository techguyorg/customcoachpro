import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import WorkoutPlanForm from "./WorkoutPlanForm";
import workoutPlanService, { type WorkoutPlanPayload } from "@/services/workoutPlanService";
import { Badge } from "@/components/ui/badge";
import { Copy, Sparkles } from "lucide-react";

export function CreateWorkoutPlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (payload: WorkoutPlanPayload) => workoutPlanService.create(payload),
    onSuccess: () => {
      toast({ title: "Workout plan created" });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      navigate("/workout-plans");
    },
    onError: (error) => {
      toast({
        title: "Unable to create plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["workout-plans"],
    queryFn: () => workoutPlanService.list(),
  });

  const duplicateMutation = useMutation({
    mutationFn: (planId: string) => workoutPlanService.duplicate(planId),
    onSuccess: (plan) => {
      toast({ title: "Template duplicated", description: "You can now customize the copy." });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      navigate(`/workout-plans/${plan.id}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Unable to duplicate template",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workout-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card className="px-4 py-2 border-dashed text-sm text-muted-foreground">
          Create a plan and start assigning it to your clients.
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <div>
              <CardTitle>Template gallery</CardTitle>
              <CardDescription>Start from an existing plan and duplicate it instantly.</CardDescription>
            </div>
          </div>
          <Badge variant="outline">{templates.length} available</Badge>
        </CardHeader>
        <CardContent>
          {loadingTemplates ? (
            <div className="text-sm text-muted-foreground">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-sm text-muted-foreground">No templates yet. Create your first plan below.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{template.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description || "No description provided."}
                      </p>
                    </div>
                    <Badge variant="secondary">{template.durationWeeks} weeks</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{template.days.length} days</span>
                    <span>•</span>
                    <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateMutation.mutate(template.id)}
                      disabled={duplicateMutation.isPending}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkoutPlanForm
        title="Create workout plan"
        description="Build a structure your clients can follow week to week."
        submitLabel="Create plan"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate("/workout-plans")}
        onSubmit={(payload) => createMutation.mutateAsync(payload)}
      />
    </div>
  );
}

export default CreateWorkoutPlanPage;
