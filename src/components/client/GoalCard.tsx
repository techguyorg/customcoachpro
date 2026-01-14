import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Scale, 
  Activity, 
  Dumbbell, 
  CheckCircle2,
  Calendar,
  TrendingUp,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateGoal, type ClientGoal } from "@/hooks/useClientProgress";
import { toast } from "sonner";

interface GoalCardProps {
  goal: ClientGoal;
  compact?: boolean;
}

const goalTypeIcons: Record<string, React.ElementType> = {
  weight: Scale,
  body_fat: Activity,
  measurement: Target,
  strength: Dumbbell,
  habit: CheckCircle2,
  custom: Target,
};

const statusColors: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  paused: "bg-muted text-muted-foreground border-border",
  abandoned: "bg-destructive/20 text-destructive border-destructive/30",
};

export function GoalCard({ goal, compact = false }: GoalCardProps) {
  const updateGoal = useUpdateGoal();
  const Icon = goalTypeIcons[goal.goal_type] || Target;

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!goal.starting_value || !goal.target_value || goal.current_value === null) {
      return null;
    }
    
    const totalChange = Math.abs(goal.target_value - goal.starting_value);
    const currentChange = Math.abs((goal.current_value ?? goal.starting_value) - goal.starting_value);
    
    return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
  };

  const progress = calculateProgress();

  const handleStatusChange = async (status: ClientGoal['status']) => {
    try {
      await updateGoal.mutateAsync({ 
        id: goal.id, 
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      });
      toast.success(`Goal ${status === 'completed' ? 'completed' : 'updated'}!`);
    } catch (error) {
      toast.error("Failed to update goal");
    }
  };

  if (compact) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{goal.title}</p>
              {progress !== null && (
                <div className="mt-2">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.toFixed(0)}% complete
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${goal.status === 'completed' ? 'border-success/30' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{goal.title}</p>
              <Badge variant="outline" className={`mt-1 text-xs ${statusColors[goal.status]}`}>
                {goal.status}
              </Badge>
            </div>
          </div>
          
          {goal.status !== 'completed' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                  Pause Goal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('abandoned')}
                  className="text-destructive"
                >
                  Abandon Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {goal.description && (
          <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
        )}

        {/* Progress */}
        {goal.target_value && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {goal.current_value ?? goal.starting_value ?? 0} / {goal.target_value} {goal.unit}
              </span>
            </div>
            {progress !== null && (
              <Progress value={progress} className="h-2" />
            )}
          </div>
        )}

        {/* Target Date */}
        {goal.target_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Target: {format(new Date(goal.target_date), "MMM d, yyyy")}</span>
          </div>
        )}

        {goal.status === 'completed' && goal.completed_at && (
          <div className="flex items-center gap-2 text-sm text-success mt-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed {format(new Date(goal.completed_at), "MMM d, yyyy")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
