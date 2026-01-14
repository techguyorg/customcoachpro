import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Loader2, ClipboardList, Utensils, User, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCoachClients } from "@/hooks/useCoachClients";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { useDietPlans } from "@/hooks/useDietPlans";
import { useAssignPlan } from "@/hooks/usePlanAssignments";
import { toast } from "sonner";

interface QuickAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedWorkoutId?: string;
  preselectedDietId?: string;
}

interface FormData {
  clientId: string;
  planType: "workout" | "diet";
  workoutTemplateId: string;
  dietPlanId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export function QuickAssignDialog({ open, onOpenChange, preselectedWorkoutId, preselectedDietId }: QuickAssignDialogProps) {
  const { data: clients } = useCoachClients();
  const { data: workoutTemplates } = useWorkoutTemplates({ search: "", templateType: "all", difficulty: "all", daysPerWeek: "all" });
  const { data: dietPlans } = useDietPlans();
  const assignPlan = useAssignPlan();

  const activeClients = clients?.filter(c => c.status === "active") || [];

  // Determine initial plan type based on preselection
  const initialPlanType = preselectedDietId ? "diet" : "workout";
  const initialWorkoutId = preselectedWorkoutId || "";
  const initialDietId = preselectedDietId || "";

  const form = useForm<FormData>({
    defaultValues: {
      clientId: "",
      planType: initialPlanType,
      workoutTemplateId: initialWorkoutId,
      dietPlanId: initialDietId,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      notes: "",
    },
  });

  // Reset form when dialog opens with preselection
  useEffect(() => {
    if (open) {
      form.reset({
        clientId: "",
        planType: preselectedDietId ? "diet" : "workout",
        workoutTemplateId: preselectedWorkoutId || "",
        dietPlanId: preselectedDietId || "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: "",
        notes: "",
      });
    }
  }, [open, preselectedWorkoutId, preselectedDietId, form]);

  const planType = form.watch("planType");

  const onSubmit = async (data: FormData) => {
    if (data.planType === "workout" && !data.workoutTemplateId) {
      toast.error("Please select a workout program");
      return;
    }
    if (data.planType === "diet" && !data.dietPlanId) {
      toast.error("Please select a diet plan");
      return;
    }

    try {
      await assignPlan.mutateAsync({
        clientId: data.clientId,
        planType: data.planType,
        workoutTemplateId: data.planType === "workout" ? data.workoutTemplateId : undefined,
        dietPlanId: data.planType === "diet" ? data.dietPlanId : undefined,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        notes: data.notes || undefined,
      });

      toast.success("Plan assigned successfully!");
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Quick Assign Plan</DialogTitle>
          <DialogDescription className="text-sm">
            Assign a workout or diet plan to a client
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeClients.map((client) => (
                        <SelectItem key={client.client_id} value={client.client_id}>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {client.profile?.full_name || "Unknown"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Type Tabs */}
            <FormField
              control={form.control}
              name="planType"
              render={({ field }) => (
                <FormItem>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="workout" className="text-xs gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5" />
                        Workout
                      </TabsTrigger>
                      <TabsTrigger value="diet" className="text-xs gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        Diet
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />

            {/* Workout Template Selection */}
            {planType === "workout" && (
              <FormField
                control={form.control}
                name="workoutTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Workout Program</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workoutTemplates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Link to="/coach/programs" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> Create New Program
                    </Link>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Diet Plan Selection */}
            {planType === "diet" && (
              <FormField
                control={form.control}
                name="dietPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Diet Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select diet plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dietPlans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Link to="/coach/diet-plans" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> Create New Diet Plan
                    </Link>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-9 text-sm" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any special instructions..."
                      rows={2}
                      className="text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={assignPlan.isPending}>
                {assignPlan.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Plan"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
