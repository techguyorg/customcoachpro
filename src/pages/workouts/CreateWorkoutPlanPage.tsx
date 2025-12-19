import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import WorkoutPlanForm from "./WorkoutPlanForm";
import workoutPlanService, { type WorkoutPlanPayload } from "@/services/workoutPlanService";

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
