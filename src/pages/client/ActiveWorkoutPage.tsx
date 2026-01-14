import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Trash2,
  Dumbbell,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  useWorkoutLogDetail, 
  useUpdateWorkoutLog, 
  useAddWorkoutExercise,
  useUpdateWorkoutExercise,
  useDeleteWorkoutLog,
  SetData
} from "@/hooks/useWorkoutLogs";
import { useAllExercises } from "@/hooks/useExercises";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActiveWorkoutPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: workoutLog, isLoading } = useWorkoutLogDetail(logId || null);
  const { data: exercises } = useAllExercises();
  const updateWorkoutLog = useUpdateWorkoutLog();
  const addWorkoutExercise = useAddWorkoutExercise();
  const updateWorkoutExercise = useUpdateWorkoutExercise();
  const deleteWorkoutLog = useDeleteWorkoutLog();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [finishNotes, setFinishNotes] = useState("");
  const [perceivedEffort, setPerceivedEffort] = useState([5]);
  const [satisfaction, setSatisfaction] = useState([3]);

  // Timer
  useEffect(() => {
    if (workoutLog?.status === "in_progress" && workoutLog.started_at) {
      const startTime = new Date(workoutLog.started_at).getTime();
      
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [workoutLog]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddExercise = async (exerciseId: string, exerciseName: string) => {
    if (!logId) return;
    
    try {
      await addWorkoutExercise.mutateAsync({
        workoutLogId: logId,
        exerciseId,
        exerciseName,
        orderIndex: workoutLog?.exercises?.length || 0,
      });
      setShowAddExercise(false);
      setExerciseSearch("");
      toast({ title: "Exercise added" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSet = async (
    exerciseLogId: string, 
    currentSetData: SetData[], 
    setIndex: number, 
    field: keyof SetData, 
    value: number | boolean
  ) => {
    if (!logId) return;

    const newSetData = [...currentSetData];
    newSetData[setIndex] = { ...newSetData[setIndex], [field]: value };
    
    const completedSets = newSetData.filter(s => s.completed).length;

    await updateWorkoutExercise.mutateAsync({
      id: exerciseLogId,
      workoutLogId: logId,
      setData: newSetData,
      setsCompleted: completedSets,
    });
  };

  const handleAddSet = async (exerciseLogId: string, currentSetData: SetData[]) => {
    if (!logId) return;

    const lastSet = currentSetData[currentSetData.length - 1];
    const newSet: SetData = {
      setNumber: currentSetData.length + 1,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      completed: false,
    };

    await updateWorkoutExercise.mutateAsync({
      id: exerciseLogId,
      workoutLogId: logId,
      setData: [...currentSetData, newSet],
    });
  };

  const handleFinishWorkout = async () => {
    if (!logId) return;

    try {
      const duration = Math.floor(elapsedTime / 60);
      await updateWorkoutLog.mutateAsync({
        id: logId,
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_minutes: duration,
        notes: finishNotes || null,
        perceived_effort: perceivedEffort[0],
        satisfaction_rating: satisfaction[0],
      });
      toast({ title: "Workout completed! 💪" });
      navigate("/client/workouts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finish workout",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkout = async () => {
    if (!logId) return;

    try {
      await deleteWorkoutLog.mutateAsync(logId);
      toast({ title: "Workout deleted" });
      navigate("/client/workouts");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workout",
        variant: "destructive",
      });
    }
  };

  const filteredExercises = exercises?.filter(ex => 
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    ex.primary_muscle.toLowerCase().includes(exerciseSearch.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!workoutLog) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Workout not found</p>
        <Button variant="link" onClick={() => navigate("/client/workouts")}>
          Back to Workouts
        </Button>
      </div>
    );
  }

  const isActive = workoutLog.status === "in_progress";

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client/workouts")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">
              {workoutLog.workout_template?.name || "Custom Workout"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(workoutLog.workout_date), "EEEE, MMM d, yyyy")}
            </p>
          </div>
        </div>
        <Badge variant={isActive ? "default" : "secondary"}>
          {workoutLog.status}
        </Badge>
      </div>

      {/* Timer Card (for active workouts) */}
      {isActive && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Discard
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowFinishDialog(true)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Finish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {workoutLog.exercises?.map((exerciseLog) => {
          const setData: SetData[] = exerciseLog.set_data || [];
          const isExpanded = expandedExercise === exerciseLog.id;

          return (
            <Card key={exerciseLog.id}>
              <CardHeader 
                className="p-4 pb-2 cursor-pointer"
                onClick={() => setExpandedExercise(isExpanded ? null : exerciseLog.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{exerciseLog.exercise_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {exerciseLog.sets_completed}/{setData.length} sets completed
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="p-4 pt-0">
                  {/* Set Headers */}
                  <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-muted-foreground font-medium">
                    <span>Set</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span></span>
                  </div>

                  {/* Sets */}
                  {setData.map((set, idx) => (
                    <div 
                      key={idx} 
                      className={`grid grid-cols-4 gap-2 mb-2 items-center ${set.completed ? 'opacity-50' : ''}`}
                    >
                      <span className="text-sm font-medium">{set.setNumber}</span>
                      <Input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleUpdateSet(exerciseLog.id, setData, idx, "weight", Number(e.target.value))}
                        className="h-8 text-sm"
                        disabled={!isActive}
                      />
                      <Input
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleUpdateSet(exerciseLog.id, setData, idx, "reps", Number(e.target.value))}
                        className="h-8 text-sm"
                        disabled={!isActive}
                      />
                      {isActive && (
                        <Button
                          size="sm"
                          variant={set.completed ? "default" : "outline"}
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateSet(exerciseLog.id, setData, idx, "completed", !set.completed)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Add Set Button */}
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleAddSet(exerciseLog.id, setData)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Set
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Add Exercise Button */}
        {isActive && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        )}

        {/* Empty State */}
        {workoutLog.exercises?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No exercises yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add exercises to start your workout
              </p>
              {isActive && (
                <Button onClick={() => setShowAddExercise(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Exercise
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Workout Summary */}
      {!isActive && workoutLog.status === "completed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workout Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workoutLog.duration_minutes && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span>{workoutLog.duration_minutes} minutes</span>
              </div>
            )}
            {workoutLog.perceived_effort && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Effort</span>
                <span>{workoutLog.perceived_effort}/10</span>
              </div>
            )}
            {workoutLog.notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1">{workoutLog.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Exercise Dialog */}
      <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
            <DialogDescription>
              Search and select an exercise to add
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search exercises..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredExercises.slice(0, 20).map((exercise) => (
                  <Card 
                    key={exercise.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleAddExercise(exercise.id, exercise.name)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {exercise.primary_muscle.replace("_", " ")} • {exercise.equipment.replace("_", " ")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finish Workout Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Workout</DialogTitle>
            <DialogDescription>
              Rate your workout and add any notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Perceived Effort (1-10)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={perceivedEffort}
                  onValueChange={setPerceivedEffort}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">{perceivedEffort[0]}</span>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Satisfaction (1-5)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={satisfaction}
                  onValueChange={setSatisfaction}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">{satisfaction[0]}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="How did the workout feel?"
                value={finishNotes}
                onChange={(e) => setFinishNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinishWorkout}>
              Complete Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workout session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkout} className="bg-destructive text-destructive-foreground">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
