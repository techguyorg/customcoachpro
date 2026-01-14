import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Plus, Trash2, Loader2, Dumbbell, Calendar, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useExercises } from "@/hooks/useExercises";

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  difficulty: string;
}

interface DayExercise {
  id: string;
  exercise_id: string | null;
  custom_exercise_name: string | null;
  sets_min: number;
  sets_max: number | null;
  reps_min: number;
  reps_max: number | null;
  rest_seconds_min: number | null;
  rest_seconds_max: number | null;
  notes: string | null;
  order_index: number;
  exercise?: Exercise | null;
}

interface Day {
  id: string;
  day_number: number;
  name: string;
  notes: string | null;
  exercises: DayExercise[];
}

interface Week {
  id: string;
  week_number: number;
  name: string | null;
  focus: string | null;
  notes: string | null;
  days: Day[];
}

interface WorkoutProgramEditorProps {
  templateId: string;
  onClose?: () => void;
}

export function WorkoutProgramEditor({ templateId, onClose }: WorkoutProgramEditorProps) {
  const queryClient = useQueryClient();
  const [addExerciseDialog, setAddExerciseDialog] = useState<{ dayId: string } | null>(null);
  const [addDayDialog, setAddDayDialog] = useState<{ weekId: string } | null>(null);
  const [addWeekDialog, setAddWeekDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'day' | 'week'; id: string; name: string } | null>(null);
  
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [newSetsMin, setNewSetsMin] = useState(3);
  const [newSetsMax, setNewSetsMax] = useState<number | undefined>();
  const [newRepsMin, setNewRepsMin] = useState(8);
  const [newRepsMax, setNewRepsMax] = useState<number | undefined>(12);
  const [newDayName, setNewDayName] = useState("");
  const [newWeekName, setNewWeekName] = useState("");
  const [newWeekFocus, setNewWeekFocus] = useState("");

  // Fetch template structure
  const { data: structureData, isLoading } = useQuery({
    queryKey: ["template-structure", templateId],
    queryFn: async () => {
      const response = await api.get<{ weeks: Week[] }>(`/api/workouts/templates/${templateId}/structure`);
      return response.weeks || [];
    },
  });

  const structure = structureData || [];

  // Fetch exercises for search
  const { data: allExercises } = useExercises({
    search: exerciseSearch,
    muscleGroup: "all",
    equipment: "all",
    difficulty: "all",
  });

  // Add exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: async ({
      dayId,
      exerciseId,
      customName,
      setsMin,
      setsMax,
      repsMin,
      repsMax,
    }: {
      dayId: string;
      exerciseId?: string;
      customName?: string;
      setsMin: number;
      setsMax?: number;
      repsMin: number;
      repsMax?: number;
    }) => {
      return api.post('/api/workouts/template-exercises', {
        day_id: dayId,
        exercise_id: exerciseId || null,
        custom_exercise_name: customName || null,
        sets_min: setsMin,
        sets_max: setsMax || null,
        reps_min: repsMin,
        reps_max: repsMax || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
      queryClient.invalidateQueries({ queryKey: ["workout-template-detail", templateId] });
      toast.success("Exercise added");
      setAddExerciseDialog(null);
      setExerciseSearch("");
      setCustomExerciseName("");
    },
    onError: () => {
      toast.error("Failed to add exercise");
    },
  });

  // Remove exercise mutation
  const removeExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      return api.delete(`/api/workouts/template-exercises/${exerciseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
      queryClient.invalidateQueries({ queryKey: ["workout-template-detail", templateId] });
      toast.success("Exercise removed");
    },
  });

  // Add day mutation
  const addDayMutation = useMutation({
    mutationFn: async ({ weekId, name }: { weekId: string; name: string }) => {
      return api.post('/api/workouts/template-days', {
        template_id: templateId,
        week_id: weekId,
        name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
      toast.success("Day added");
      setAddDayDialog(null);
      setNewDayName("");
    },
    onError: () => {
      toast.error("Failed to add day");
    },
  });

  // Delete day mutation
  const deleteDayMutation = useMutation({
    mutationFn: async (dayId: string) => {
      return api.delete(`/api/workouts/template-days/${dayId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
      toast.success("Day removed");
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error("Failed to remove day");
    },
  });

  // Add week mutation
  const addWeekMutation = useMutation({
    mutationFn: async ({ name, focus }: { name: string; focus: string }) => {
      return api.post('/api/workouts/template-weeks', {
        template_id: templateId,
        name: name || null,
        focus: focus || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
      toast.success("Week added");
      setAddWeekDialog(false);
      setNewWeekName("");
      setNewWeekFocus("");
    },
    onError: () => {
      toast.error("Failed to add week");
    },
  });

  // Delete week mutation
  const deleteWeekMutation = useMutation({
    mutationFn: async (weekId: string) => {
      return api.delete(`/api/workouts/template-weeks/${weekId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
      toast.success("Week removed");
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error("Failed to remove week");
    },
  });

  // Reorder exercises mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ dayId, exerciseIds }: { dayId: string; exerciseIds: string[] }) => {
      return api.put(`/api/workouts/template-days/${dayId}/reorder`, { exercise_ids: exerciseIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-structure", templateId] });
    },
    onError: () => {
      toast.error("Failed to reorder exercises");
    },
  });

  const handleAddExercise = (exerciseId?: string) => {
    if (!addExerciseDialog) return;

    addExerciseMutation.mutate({
      dayId: addExerciseDialog.dayId,
      exerciseId,
      customName: exerciseId ? undefined : customExerciseName,
      setsMin: newSetsMin,
      setsMax: newSetsMax,
      repsMin: newRepsMin,
      repsMax: newRepsMax,
    });
  };

  const handleMoveExercise = (dayId: string, exercises: DayExercise[], currentIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    
    const reordered = [...exercises];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];
    
    reorderMutation.mutate({
      dayId,
      exerciseIds: reordered.map(e => e.id),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Program Structure</h2>
          <p className="text-xs text-muted-foreground">
            Manage weeks, days, and exercises
          </p>
        </div>
        <Button size="sm" onClick={() => setAddWeekDialog(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Week
        </Button>
      </div>

      {structure.length > 0 ? (
        <Accordion type="multiple" defaultValue={structure.map(w => w.id)} className="space-y-3">
          {structure.map((week) => (
            <AccordionItem
              key={week.id}
              value={week.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                  <div className="flex flex-wrap items-center gap-2 text-left">
                    <Badge variant="outline" className="text-[10px]">Week {week.week_number}</Badge>
                    <span className="font-medium text-sm">{week.name || `Week ${week.week_number}`}</span>
                    {week.focus && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">• {week.focus}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ type: 'week', id: week.id, name: week.name || `Week ${week.week_number}` });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-3 mt-2">
                  {week.days.map((day) => (
                    <Card key={day.id} className="overflow-hidden">
                      <CardHeader className="py-2 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                              {day.day_number}
                            </div>
                            <CardTitle className="text-sm truncate">{day.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setAddExerciseDialog({ dayId: day.id })}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm({ type: 'day', id: day.id, name: day.name })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-3 pb-3">
                        {day.exercises.length > 0 ? (
                          <div className="space-y-1.5">
                            {day.exercises.map((ex, idx) => (
                              <div
                                key={ex.id}
                                className="flex items-center gap-2 py-1.5 px-2 bg-muted/50 rounded-lg group"
                              >
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0"
                                    disabled={idx === 0 || reorderMutation.isPending}
                                    onClick={() => handleMoveExercise(day.id, day.exercises, idx, 'up')}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0"
                                    disabled={idx === day.exercises.length - 1 || reorderMutation.isPending}
                                    onClick={() => handleMoveExercise(day.id, day.exercises, idx, 'down')}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </Button>
                                </div>
                                <span className="text-muted-foreground text-xs w-4 shrink-0">
                                  {idx + 1}.
                                </span>
                                <Dumbbell className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="flex-1 font-medium text-xs truncate">
                                  {ex.exercise?.name || ex.custom_exercise_name || "Unknown"}
                                </span>
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {ex.sets_min}{ex.sets_max && ex.sets_max !== ex.sets_min ? `-${ex.sets_max}` : ""} × {ex.reps_min}{ex.reps_max && ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={() => removeExerciseMutation.mutate(ex.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            No exercises added
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Add Day Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAddDayDialog({ weekId: week.id })}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Add Day to Week {week.week_number}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">No program structure defined yet</p>
          <Button size="sm" onClick={() => setAddWeekDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Week
          </Button>
        </div>
      )}

      {/* Add Exercise Dialog */}
      <Dialog open={!!addExerciseDialog} onOpenChange={(open) => !open && setAddExerciseDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Add Exercise</DialogTitle>
            <DialogDescription className="text-xs">
              Search for an exercise or add a custom one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Sets/Reps Config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Sets</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newSetsMin}
                    onChange={(e) => setNewSetsMin(parseInt(e.target.value) || 1)}
                    placeholder="Min"
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground self-center text-sm">-</span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newSetsMax || ""}
                    onChange={(e) => setNewSetsMax(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Max"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newRepsMin}
                    onChange={(e) => setNewRepsMin(parseInt(e.target.value) || 1)}
                    placeholder="Min"
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground self-center text-sm">-</span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newRepsMax || ""}
                    onChange={(e) => setNewRepsMax(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Max"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Search Exercises */}
            <div>
              <Label className="text-xs">Search Exercises</Label>
              <Input
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search by name..."
                className="mt-1 h-8 text-sm"
              />
            </div>

            {exerciseSearch && allExercises && allExercises.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {allExercises.slice(0, 10).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExercise(ex.id)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 border-b last:border-b-0"
                    disabled={addExerciseMutation.isPending}
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="flex-1 text-xs">{ex.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {ex.primary_muscle.replace(/_/g, " ")}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            <Separator />

            {/* Custom Exercise */}
            <div>
              <Label className="text-xs">Or Add Custom Exercise</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  placeholder="Custom exercise name..."
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddExercise()}
                  disabled={!customExerciseName.trim() || addExerciseMutation.isPending}
                >
                  {addExerciseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Day Dialog */}
      <Dialog open={!!addDayDialog} onOpenChange={(open) => !open && setAddDayDialog(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Day</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new training day to this week
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs">Day Name</Label>
              <Input
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                placeholder="e.g., Push Day, Leg Day, Upper Body..."
                className="mt-1 h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDayDialog(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => addDayDialog && addDayMutation.mutate({ weekId: addDayDialog.weekId, name: newDayName || "New Day" })}
              disabled={addDayMutation.isPending}
            >
              {addDayMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Week Dialog */}
      <Dialog open={addWeekDialog} onOpenChange={setAddWeekDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Week</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new week to your program
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs">Week Name (optional)</Label>
              <Input
                value={newWeekName}
                onChange={(e) => setNewWeekName(e.target.value)}
                placeholder="e.g., Accumulation, Intensification..."
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Focus (optional)</Label>
              <Input
                value={newWeekFocus}
                onChange={(e) => setNewWeekFocus(e.target.value)}
                placeholder="e.g., Volume, Strength, Deload..."
                className="mt-1 h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddWeekDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => addWeekMutation.mutate({ name: newWeekName, focus: newWeekFocus })}
              disabled={addWeekMutation.isPending}
            >
              {addWeekMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Week
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type === 'week' ? 'Week' : 'Day'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? 
              {deleteConfirm?.type === 'week' 
                ? " This will also delete all days and exercises in this week."
                : " All exercises in this day will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'week') {
                  deleteWeekMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'day') {
                  deleteDayMutation.mutate(deleteConfirm.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}