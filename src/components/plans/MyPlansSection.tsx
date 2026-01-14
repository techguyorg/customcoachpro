import { Loader2, PlayCircle } from "lucide-react";
import { useClientAssignments, useUpdateAssignment, type PlanAssignmentWithDetails } from "@/hooks/usePlanAssignments";
import { toast } from "sonner";
import { EnhancedActivePlanCard } from "./EnhancedActivePlanCard";

interface MyPlansSectionProps {
  planType?: "workout" | "diet" | "all";
  title?: string;
}

export function MyPlansSection({ planType = "all", title = "My Active Plans" }: MyPlansSectionProps) {
  const { data: assignments, isLoading } = useClientAssignments();
  const updateAssignment = useUpdateAssignment();

  const activePlans = assignments?.filter(a => {
    if (a.status !== "active") return false;
    if (planType === "all") return true;
    return a.plan_type === planType;
  }) || [];

  const handlePause = (id: string) => {
    updateAssignment.mutate(
      { id, status: "paused" },
      {
        onSuccess: () => toast.success("Plan paused"),
        onError: () => toast.error("Failed to pause plan"),
      }
    );
  };

  const handleComplete = (id: string) => {
    updateAssignment.mutate(
      { id, status: "completed" },
      {
        onSuccess: () => toast.success("Plan marked as complete! Great job! 🎉"),
        onError: () => toast.error("Failed to complete plan"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activePlans.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-primary" />
        {title}
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {activePlans.map((plan) => (
          <EnhancedActivePlanCard
            key={plan.id}
            plan={plan}
            onPause={() => handlePause(plan.id)}
            onComplete={() => handleComplete(plan.id)}
            isPending={updateAssignment.isPending}
            compact
          />
        ))}
      </div>
    </div>
  );
}
