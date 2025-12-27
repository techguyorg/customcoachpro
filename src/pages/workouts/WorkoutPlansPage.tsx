import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, MoreHorizontal, Trash2, Users, Copy } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import workoutPlanService from "@/services/workoutPlanService";
import type { WorkoutPlan } from "@/types";

function PlanCard({
  plan,
  onAssign,
  onDelete,
  onDuplicate,
}: {
  plan: WorkoutPlan;
  onAssign: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all group"
      onClick={() => navigate(`/workout-plans/${plan.id}/edit`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-icon-workout/10 group-hover:bg-icon-workout/20 transition-colors">
              <Dumbbell className="h-5 w-5 text-icon-workout" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.durationWeeks} weeks</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/workout-plans/${plan.id}/edit`);
                }}
              >
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign();
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Assign to Client
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plan.description || "No description"}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline">{plan.days.length} days</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {new Date(plan.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card key={idx} className="border-dashed">
          <CardHeader className="space-y-2">
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
            <div className="flex justify-between pt-2">
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function WorkoutPlansPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["workout-plans"],
    queryFn: () => workoutPlanService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => workoutPlanService.remove(planId),
    onSuccess: () => {
      toast({ title: "Workout plan deleted" });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting plan",
        description: error instanceof Error ? error.message : "Failed to delete workout plan.",
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (planId: string) => workoutPlanService.duplicate(planId),
    onSuccess: (plan) => {
      toast({ title: "Plan duplicated", description: "You can now edit the copy." });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      navigate(`/workout-plans/${plan.id}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Unable to duplicate plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (planId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this workout plan?");
    if (!confirmDelete) return;
    deleteMutation.mutate(planId);
  };

  if (!isLoading && plans.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Workout Plans" description="Create and manage workout plans for your clients" />
        <EmptyState
          icon={Dumbbell}
          title="No workout plans yet"
          description="Create your first workout plan to start assigning programs to your clients."
          actionLabel="Create Workout Plan"
          onAction={() => navigate("/workout-plans/new")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Workout Plans"
        description="Create and manage workout plans for your clients"
        actions={
          <Button onClick={() => navigate("/workout-plans/new")} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        }
      />

      {isLoading ? (
        <LoadingGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onAssign={() => navigate(`/workout-plans/${plan.id}/assign`)}
              onDelete={() => handleDelete(plan.id)}
              onDuplicate={() => duplicateMutation.mutate(plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkoutPlansPage;
