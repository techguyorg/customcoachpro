import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DietPlanForm from "./DietPlanForm";
import dietPlanService, { type UpdateDietPlanPayload } from "@/services/dietPlanService";
import mealService from "@/services/mealService";

export function EditDietPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meals = [] } = useQuery({
    queryKey: ["meals"],
    queryFn: () => mealService.list(),
  });

  const { data: plan, isLoading } = useQuery({
    queryKey: ["diet-plan", id],
    queryFn: () => dietPlanService.get(id!),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateDietPlanPayload) => dietPlanService.update(id!, payload),
    onSuccess: () => {
      toast({ title: "Diet plan updated" });
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
      navigate("/diet-plans");
    },
    onError: (error) => {
      toast({
        title: "Unable to update diet plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!id) return null;

  const handleSubmit = async (payload: DietPlanPayload) => {
    await updateMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/diet-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card className="px-4 py-2 border-dashed text-sm text-muted-foreground">
          Update macro targets and meals without rebuilding from scratch.
        </Card>
      </div>

      {isLoading || !plan ? (
        <Card className="p-6">Loading plan...</Card>
      ) : (
        <DietPlanForm
          meals={meals}
          initialData={plan}
          title="Edit diet plan"
          description="Keep your nutrition templates up to date."
          submitLabel="Save changes"
          isSubmitting={updateMutation.isPending}
          onCancel={() => navigate("/diet-plans")}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

export default EditDietPlanPage;
