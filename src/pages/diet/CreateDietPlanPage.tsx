import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import DietPlanForm from "./DietPlanForm";
import mealService from "@/services/mealService";
import dietPlanService, { type DietPlanPayload } from "@/services/dietPlanService";
import { buildDietTemplates } from "./templates";

export function CreateDietPlanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["meals"],
    queryFn: () => mealService.list(),
  });

  const { data: remoteTemplates = [] } = useQuery({
    queryKey: ["diet-plan-templates"],
    queryFn: () => dietPlanService.templates(),
    retry: false,
  });

  const templates = useMemo(
    () => (remoteTemplates.length ? remoteTemplates : buildDietTemplates(meals)),
    [remoteTemplates, meals]
  );

  const createMutation = useMutation({
    mutationFn: (payload: DietPlanPayload) => dietPlanService.create(payload),
    onSuccess: () => {
      toast({ title: "Diet plan created" });
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
      navigate("/diet-plans");
    },
    onError: (error) => {
      toast({
        title: "Unable to create diet plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/diet-plans")}> 
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card className="px-4 py-2 border-dashed text-sm text-muted-foreground">
          Build a custom nutrition plan or start from a template.
        </Card>
      </div>

      <DietPlanForm
        meals={meals}
        templates={mealsLoading ? [] : templates}
        title="Create diet plan"
        description="Craft macros and meals your clients can follow."
        submitLabel="Create plan"
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate("/diet-plans")}
        onSubmit={(payload) => createMutation.mutateAsync(payload)}
      />
    </div>
  );
}

export default CreateDietPlanPage;
