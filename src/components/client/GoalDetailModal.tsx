import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Target,
  Scale,
  Ruler,
  Dumbbell,
  Flame,
  Clock,
  Trophy,
  Pause,
  X,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import type { ClientGoal } from "@/hooks/useClientProgress";
import { useUpdateGoal } from "@/hooks/useClientProgress";
import { toast } from "sonner";

interface GoalDetailModalProps {
  goal: ClientGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const goalTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  weight: Scale,
  body_fat: Flame,
  measurement: Ruler,
  strength: Dumbbell,
  habit: CheckCircle2,
  custom: Target,
};

const statusColors: Record<string, string> = {
  active: "bg-primary text-primary-foreground",
  completed: "bg-success text-white",
  paused: "bg-warning text-white",
  abandoned: "bg-destructive text-white",
};

export function GoalDetailModal({ goal, open, onOpenChange }: GoalDetailModalProps) {
  const updateGoal = useUpdateGoal();

  if (!goal) return null;

  const Icon = goalTypeIcons[goal.goal_type] || Target;

  const calculateProgress = () => {
    if (!goal.starting_value || !goal.target_value) return null;
    const current = goal.current_value ?? goal.starting_value;
    const total = Math.abs(goal.target_value - goal.starting_value);
    const progress = Math.abs(current - goal.starting_value);
    return Math.min(100, Math.round((progress / total) * 100));
  };

  const progressPercent = calculateProgress();

  const handleStatusChange = async (newStatus: 'completed' | 'paused' | 'abandoned' | 'active') => {
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      });
      toast.success(`Goal ${newStatus === 'completed' ? 'completed! 🎉' : newStatus}`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to update goal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {goal.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={statusColors[goal.status]}>
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {goal.goal_type.replace('_', ' ')}
            </Badge>
          </div>

          {/* Description */}
          {goal.description && (
            <div>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </div>
          )}

          {/* Progress Section */}
          {goal.target_value && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPercent ?? 0}%</span>
              </div>
              <Progress value={progressPercent ?? 0} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span>Start: {goal.starting_value} {goal.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span>Target: {goal.target_value} {goal.unit}</span>
                </div>
              </div>
              {goal.current_value && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold text-primary">
                    {goal.current_value} {goal.unit}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3" />
                Created
              </div>
              <p className="text-sm font-medium">
                {format(new Date(goal.created_at), "MMM d, yyyy")}
              </p>
            </div>
            {goal.target_date && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                  Target Date
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(goal.target_date), "MMM d, yyyy")}
                </p>
              </div>
            )}
            {goal.completed_at && (
              <div className="p-3 bg-success/10 rounded-lg col-span-2">
                <div className="flex items-center gap-2 text-xs text-success mb-1">
                  <Trophy className="w-3 h-3" />
                  Completed
                </div>
                <p className="text-sm font-medium text-success">
                  {format(new Date(goal.completed_at), "MMM d, yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {goal.status === 'active' && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={() => handleStatusChange('completed')}
                disabled={updateGoal.isPending}
                className="gap-1"
              >
                <Trophy className="w-3 h-3" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('paused')}
                disabled={updateGoal.isPending}
                className="gap-1"
              >
                <Pause className="w-3 h-3" />
                Pause
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange('abandoned')}
                disabled={updateGoal.isPending}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <X className="w-3 h-3" />
                Abandon
              </Button>
            </div>
          )}

          {goal.status === 'paused' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={() => handleStatusChange('active')}
                disabled={updateGoal.isPending}
              >
                Resume Goal
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
