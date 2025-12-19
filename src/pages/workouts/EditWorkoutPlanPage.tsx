import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import WorkoutPlanForm from "./WorkoutPlanForm";
import workoutPlanService, { type WorkoutPlanPayload } from "@/services/workoutPlanService";

export function EditWorkoutPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workout-plan", id],
    queryFn: () => workoutPlanService.get(id!),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: WorkoutPlanPayload) => workoutPlanService.update(id!, payload),
    onSuccess: () => {
      toast({ title: "Workout plan updated" });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      queryClient.invalidateQueries({ queryKey: ["workout-plan", id] });
      navigate("/workout-plans");
    },
    onError: (error) => {
      toast({
        title: "Unable to update plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!id) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workout-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card className="px-4 py-2 border-dashed text-sm text-muted-foreground">
          Update plan details or tweak the day layout.
        </Card>
      </div>

      {isLoading && <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />}

      {isError && (
        <div className="text-center text-sm text-destructive">
          Unable to load workout plan. Please go back and try again.
        </div>
      )}

      {plan && (
        <WorkoutPlanForm
          initialData={plan}
          title="Edit workout plan"
          description="Adjust workouts and details without losing existing structure."
          submitLabel="Save changes"
          isSubmitting={updateMutation.isPending}
          onCancel={() => navigate("/workout-plans")}
          onSubmit={(payload) => updateMutation.mutateAsync(payload)}
        />
      )}
    </div>
  );
}

export default EditWorkoutPlanPage;
