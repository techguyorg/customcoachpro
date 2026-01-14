import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Play, FileText, Zap } from "lucide-react";
import { useActiveAssignments } from "@/hooks/usePlanAssignments";
import { useCreateWorkoutLog } from "@/hooks/useWorkoutLogs";
import { useToast } from "@/hooks/use-toast";

interface StartWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartWorkoutDialog({ open, onOpenChange }: StartWorkoutDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const activeAssignments = useActiveAssignments();
  const createWorkoutLog = useCreateWorkoutLog();
  const [isStarting, setIsStarting] = useState(false);

  const activeWorkoutPlan = activeAssignments?.find(a => a.plan_type === "workout");

  const handleStartEmptyWorkout = async () => {
    setIsStarting(true);
    try {
      const log = await createWorkoutLog.mutateAsync({});
      onOpenChange(false);
      navigate(`/client/workouts/${log.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartFromProgram = async () => {
    if (!activeWorkoutPlan?.workout_template_id) return;
    
    setIsStarting(true);
    try {
      const log = await createWorkoutLog.mutateAsync({
        templateId: activeWorkoutPlan.workout_template_id,
        assignmentId: activeWorkoutPlan.id,
      });
      onOpenChange(false);
      navigate(`/client/workouts/${log.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Workout</DialogTitle>
          <DialogDescription>
            Choose how you want to start your workout session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* From Active Program */}
          {activeWorkoutPlan && (
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={handleStartFromProgram}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">From Program</p>
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeWorkoutPlan.workout_template?.name}
                    </p>
                  </div>
                  <Button size="sm" disabled={isStarting}>
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Start / Empty Workout */}
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={handleStartEmptyWorkout}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Empty Workout</p>
                  <p className="text-xs text-muted-foreground">
                    Add exercises as you go
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={isStarting}>
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Browse Templates */}
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              onOpenChange(false);
              navigate("/client/programs");
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Browse Programs</p>
                  <p className="text-xs text-muted-foreground">
                    Find a workout program to follow
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
