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
import { useAddGoal } from "@/hooks/useClientProgress";
import { toast } from "sonner";
import { Loader2, Target } from "lucide-react";

const goalSchema = z.object({
  goal_type: z.enum(['weight', 'body_fat', 'measurement', 'strength', 'habit', 'custom']),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  target_value: z.coerce.number().optional().nullable(),
  starting_value: z.coerce.number().optional().nullable(),
  current_value: z.coerce.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  target_date: z.string().optional().nullable(),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).default('active'),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const goalTypes = [
  { value: 'weight', label: 'Weight Goal', unit: 'kg' },
  { value: 'body_fat', label: 'Body Fat Goal', unit: '%' },
  { value: 'measurement', label: 'Measurement Goal', unit: 'cm' },
  { value: 'strength', label: 'Strength Goal', unit: 'kg' },
  { value: 'habit', label: 'Habit Goal', unit: 'times' },
  { value: 'custom', label: 'Custom Goal', unit: '' },
];

export function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
  const addGoal = useAddGoal();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_type: 'weight',
      status: 'active',
    },
  });

  const selectedType = form.watch('goal_type');
  const defaultUnit = goalTypes.find(t => t.value === selectedType)?.unit || '';

  const onSubmit = async (data: GoalFormData) => {
    try {
      await addGoal.mutateAsync({
        goal_type: data.goal_type,
        title: data.title,
        description: data.description || null,
        target_value: data.target_value || null,
        starting_value: data.starting_value || null,
        current_value: data.starting_value || null,
        unit: data.unit || defaultUnit || null,
        target_date: data.target_date || null,
        status: data.status,
      });
      toast.success("Goal created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Set New Goal
          </DialogTitle>
          <DialogDescription>
            Define a goal to track your progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="goal_type">Goal Type</Label>
            <Select 
              value={form.watch('goal_type')} 
              onValueChange={(value) => form.setValue('goal_type', value as GoalFormData['goal_type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Reach 70kg weight"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Why is this goal important to you?"
              {...form.register("description")}
            />
          </div>

          {/* Values */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starting_value">Starting</Label>
              <Input
                id="starting_value"
                type="number"
                step="0.1"
                placeholder="80"
                {...form.register("starting_value")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_value">Target</Label>
              <Input
                id="target_value"
                type="number"
                step="0.1"
                placeholder="70"
                {...form.register("target_value")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder={defaultUnit}
                {...form.register("unit")}
              />
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date (optional)</Label>
            <Input
              id="target_date"
              type="date"
              {...form.register("target_date")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addGoal.isPending}>
              {addGoal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
