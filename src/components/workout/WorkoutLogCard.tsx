import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, ChevronRight, Flame } from "lucide-react";
import { format } from "date-fns";
import { WorkoutLog } from "@/hooks/useWorkoutLogs";

interface WorkoutLogCardProps {
  log: WorkoutLog;
  showLink?: boolean;
}

export function WorkoutLogCard({ log, showLink = true }: WorkoutLogCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-500";
      case "skipped":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">
                {log.workout_template?.name || log.template_day?.name || "Custom Workout"}
              </p>
              <Badge variant="secondary" className={getStatusColor(log.status)}>
                {log.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(log.workout_date), "MMM d, yyyy")}
              </span>
              {log.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" />
                  {log.duration_minutes} min
                </span>
              )}
              {log.perceived_effort && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Effort: {log.perceived_effort}/10
                </span>
              )}
            </div>
          </div>
          {showLink && (
            <Link to={`/client/workouts/${log.id}`}>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
