import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAssignPlan } from "@/hooks/usePlanAssignments";
import { useWorkoutTemplates, type TemplateFilters } from "@/hooks/useWorkoutTemplates";
import { useDietPlans } from "@/hooks/useDietPlans";
import { toast } from "sonner";
import { Loader2, ClipboardList, Dumbbell, UtensilsCrossed } from "lucide-react";

const assignmentSchema = z.object({
  plan_type: z.enum(['workout', 'diet']),
  workout_template_id: z.string().optional(),
  diet_plan_id: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function AssignPlanDialog({ open, onOpenChange, clientId, clientName }: AssignPlanDialogProps) {
  const assignPlan = useAssignPlan();
  const defaultFilters: TemplateFilters = { search: "", templateType: "all", difficulty: "all", daysPerWeek: "all" };
  const { data: templates = [], isLoading: loadingTemplates } = useWorkoutTemplates(defaultFilters);
  const { data: dietPlans = [], isLoading: loadingDietPlans } = useDietPlans();

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      plan_type: 'workout',
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  const planType = form.watch("plan_type");

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      if (data.plan_type === 'workout' && !data.workout_template_id) {
        toast.error("Please select a workout template");
        return;
      }
      if (data.plan_type === 'diet' && !data.diet_plan_id) {
        toast.error("Please select a diet plan");
        return;
      }

      await assignPlan.mutateAsync({
        clientId,
        planType: data.plan_type,
        workoutTemplateId: data.workout_template_id,
        dietPlanId: data.diet_plan_id,
        startDate: data.start_date,
        endDate: data.end_date,
        notes: data.notes,
      });

      toast.success(`${data.plan_type === 'workout' ? 'Workout' : 'Diet'} plan assigned! Client will be notified.`);
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to assign plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Assign Plan
          </DialogTitle>
          <DialogDescription>
            Assign a workout or diet plan to {clientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Plan Type */}
          <div className="space-y-2">
            <Label>Plan Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => form.setValue("plan_type", "workout")}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  planType === 'workout' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Dumbbell className={`w-6 h-6 mb-2 ${planType === 'workout' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-medium">Workout Plan</p>
                <p className="text-xs text-muted-foreground">Assign workout templates</p>
              </button>
              <button
                type="button"
                onClick={() => form.setValue("plan_type", "diet")}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  planType === 'diet' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <UtensilsCrossed className={`w-6 h-6 mb-2 ${planType === 'diet' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-medium">Diet Plan</p>
                <p className="text-xs text-muted-foreground">Assign nutrition plans</p>
              </button>
            </div>
          </div>

          {/* Workout Template Selection */}
          {planType === 'workout' && (
            <div className="space-y-2">
              <Label>Select Workout Template</Label>
              <Select 
                value={form.watch("workout_template_id")} 
                onValueChange={(value) => form.setValue("workout_template_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingTemplates ? (
                    <div className="p-2 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : templates.length > 0 ? (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {template.days_per_week}d/wk
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      No templates available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Diet Plan Selection */}
          {planType === 'diet' && (
            <div className="space-y-2">
              <Label>Select Diet Plan</Label>
              <Select 
                value={form.watch("diet_plan_id")} 
                onValueChange={(value) => form.setValue("diet_plan_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a diet plan..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingDietPlans ? (
                    <div className="p-2 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : dietPlans.length > 0 ? (
                    dietPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center gap-2">
                          <span>{plan.name}</span>
                          {plan.calories_target && (
                            <Badge variant="outline" className="text-xs">
                              {plan.calories_target} kcal
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      No diet plans available. Create one first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (optional)</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Client (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes..."
              {...form.register("notes")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={assignPlan.isPending}
            >
              {assignPlan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
