import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ListFilter, Plus, Search, Trash2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Exercise, WorkoutPlan } from "@/types";
import type { WorkoutPlanPayload } from "@/services/workoutPlanService";
import exerciseService from "@/services/exerciseService";

type WorkoutExerciseForm = {
  id: string;
  exerciseId?: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  notes?: string;
  order: number;
  muscleGroups?: string[];
  tags?: string[];
  equipment?: string;
};

type WorkoutDayForm = {
  id: string;
  name: string;
  dayNumber: number;
  exercises: WorkoutExerciseForm[];
};

type WorkoutPlanFormProps = {
  initialData?: WorkoutPlan;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: WorkoutPlanPayload) => Promise<void>;
};

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function mapPlanToForm(plan?: WorkoutPlan): WorkoutDayForm[] {
  if (!plan) {
    return [
      {
        id: generateId(),
        name: "Day 1",
        dayNumber: 1,
        exercises: [],
      },
    ];
  }

  return plan.days
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day, idx) => ({
      id: day.id || generateId(),
      name: day.name || `Day ${idx + 1}`,
      dayNumber: day.dayNumber || idx + 1,
      exercises: (day.exercises || [])
        .sort((a, b) => a.order - b.order)
        .map((exercise, orderIdx) => ({
          id: exercise.id || generateId(),
          exerciseId: exercise.exerciseId || exercise.exercise?.id,
          exerciseName: exercise.exerciseName || exercise.exercise?.name || "",
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          tempo: exercise.tempo,
          notes: exercise.notes,
          order: exercise.order || orderIdx + 1,
          muscleGroups: exercise.exercise?.muscleGroups,
          tags: exercise.exercise?.tags,
          equipment: exercise.exercise?.equipment,
        })),
    }));
}

type ExercisePickerProps = {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  muscleGroups: string[];
  tags: string[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  muscleFilter: string;
  onMuscleFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  onSelect: (exercise: Exercise) => void;
};

function ExercisePicker({
  open,
  onClose,
  exercises,
  muscleGroups,
  tags,
  isLoading,
  search,
  onSearchChange,
  muscleFilter,
  onMuscleFilterChange,
  tagFilter,
  onTagFilterChange,
  onSelect,
}: ExercisePickerProps) {
  const handleClose = (value: boolean) => {
    if (!value) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Pick an exercise</DialogTitle>
          <DialogDescription>Search your library and link movements directly to this plan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Search</Label>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Bench press, rows..."
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Muscle group</Label>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <ListFilter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={muscleFilter}
                  onChange={(e) => onMuscleFilterChange(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                >
                  <option value="">All</option>
                  {muscleGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Tags</Label>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <ListFilter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={tagFilter}
                  onChange={(e) => onTagFilterChange(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                >
                  <option value="">All</option>
                  {tags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[360px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Loading exercises...
              </div>
            ) : exercises.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No exercises found. Try adjusting your filters.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {exercises.map((exercise) => (
                  <div key={exercise.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold leading-tight">{exercise.name}</h4>
                        {exercise.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{exercise.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">Library</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {exercise.muscleGroups?.map((group) => (
                        <Badge key={group} variant="secondary">
                          {group}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {exercise.tags?.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-1">
                          #{tag}
                        </span>
                      ))}
                      {exercise.equipment && (
                        <span className="rounded-full bg-muted px-2 py-1">Equipment: {exercise.equipment}</span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => onSelect(exercise)}>
                        Use exercise
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WorkoutPlanForm({
  initialData,
  title,
  description,
  submitLabel,
  isSubmitting,
  onCancel,
  onSubmit,
}: WorkoutPlanFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [durationWeeks, setDurationWeeks] = useState(initialData?.durationWeeks ?? 4);
  const [planDescription, setPlanDescription] = useState(initialData?.description ?? "");
  const [days, setDays] = useState<WorkoutDayForm[]>(() => mapPlanToForm(initialData));
  const [pickerTarget, setPickerTarget] = useState<{ dayId: string; exerciseId: string } | null>(null);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const exerciseQuery = useQuery({
    queryKey: ["exercises", search, muscleFilter, tagFilter],
    queryFn: () =>
      exerciseService.list({
        search: search || undefined,
        muscle: muscleFilter || undefined,
        tag: tagFilter || undefined,
      }),
  });

  const exercises = exerciseQuery.data?.data ?? [];
  const muscleGroups = exerciseQuery.data?.filters?.muscleGroups ?? [];
  const tags = exerciseQuery.data?.filters?.tags ?? [];

  const totalDays = useMemo(() => days.length, [days]);

  const addDay = () => {
    setDays((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `Day ${prev.length + 1}`,
        dayNumber: prev.length + 1,
        exercises: [],
      },
    ]);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) =>
      prev
        .filter((d) => d.id !== dayId)
        .map((d, idx) => ({
          ...d,
          dayNumber: idx + 1,
        }))
    );
  };

  const updateDay = (dayId: string, updates: Partial<WorkoutDayForm>) => {
    setDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, ...updates } : day))
    );
  };

  const addExercise = (dayId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  id: generateId(),
                  exerciseId: undefined,
                  exerciseName: "",
                  sets: 3,
                  reps: "10",
                  restSeconds: 90,
                  order: day.exercises.length + 1,
                  muscleGroups: undefined,
                  tags: undefined,
                  equipment: undefined,
                },
              ],
            }
          : day
      )
    );
  };

  const updateExercise = (dayId: string, exerciseId: string, updates: Partial<WorkoutExerciseForm>) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((exercise) =>
                exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
              ),
            }
          : day
      )
    );
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (!pickerTarget) return;

    updateExercise(pickerTarget.dayId, pickerTarget.exerciseId, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroups: exercise.muscleGroups,
      tags: exercise.tags,
      equipment: exercise.equipment,
    });
    setPickerTarget(null);
  };

  const clearLinkedExercise = (dayId: string, exerciseId: string) => {
    updateExercise(dayId, exerciseId, {
      exerciseId: undefined,
      muscleGroups: undefined,
      tags: undefined,
      equipment: undefined,
    });
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises
                .filter((exercise) => exercise.id !== exerciseId)
                .map((exercise, idx) => ({ ...exercise, order: idx + 1 })),
            }
          : day
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const duration = Number(durationWeeks) || 1;

    if (!trimmedName) return;

    const payload: WorkoutPlanPayload = {
      name: trimmedName,
      description: planDescription.trim() || undefined,
      durationWeeks: duration,
      days: days.map((day, idx) => ({
        name: day.name.trim() || `Day ${idx + 1}`,
        dayNumber: idx + 1,
        exercises: day.exercises.map((exercise, exIdx) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName.trim() || undefined,
          sets: Number(exercise.sets) || 0,
          reps: exercise.reps,
          restSeconds: Number(exercise.restSeconds) || 0,
          tempo: exercise.tempo?.trim() || undefined,
          notes: exercise.notes?.trim() || undefined,
          order: exIdx + 1,
        })),
      })),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
          <CardDescription>Give your workout plan a name and overview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan name</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 4-Week Strength Foundations"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total days</Label>
              <Input value={totalDays} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              placeholder="Briefly describe the focus of this program."
              rows={3}
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between space-y-0">
          <div>
            <CardTitle>Days & Exercises</CardTitle>
            <CardDescription>Outline the workouts and optional movements.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addDay}>
            <Plus className="h-4 w-4 mr-2" />
            Add day
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((day) => (
            <div key={day.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Day name</Label>
                  <Input
                    value={day.name}
                    onChange={(e) => updateDay(day.id, { name: e.target.value })}
                    placeholder={`Day ${day.dayNumber}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDay(day.id)}
                  disabled={days.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="space-y-3">
                {day.exercises.map((exercise) => (
                  <div key={exercise.id} className="border rounded-md p-3 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Exercise name</Label>
                          {exercise.exerciseId && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Linked
                            </span>
                          )}
                        </div>
                        <Input
                          value={exercise.exerciseName}
                          onChange={(e) => updateExercise(day.id, exercise.id, { exerciseName: e.target.value })}
                          placeholder="e.g. Bench Press"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPickerTarget({ dayId: day.id, exerciseId: exercise.id })}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Browse library
                          </Button>
                          {exercise.exerciseId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearLinkedExercise(day.id, exercise.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Clear link
                            </Button>
                          )}
                        </div>
                        {(exercise.muscleGroups?.length || exercise.tags?.length) && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {exercise.muscleGroups?.map((group) => (
                              <Badge key={group} variant="secondary">
                                {group}
                              </Badge>
                            ))}
                            {exercise.tags?.map((tag) => (
                              <span key={tag} className="rounded-full bg-muted px-2 py-1">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {exercise.equipment && (
                          <p className="text-xs text-muted-foreground">Equipment: {exercise.equipment}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(day.id, exercise.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label>Sets</Label>
                        <Input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(e) => updateExercise(day.id, exercise.id, { sets: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reps</Label>
                        <Input
                          value={exercise.reps}
                          onChange={(e) => updateExercise(day.id, exercise.id, { reps: e.target.value })}
                          placeholder="8-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rest (seconds)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={exercise.restSeconds}
                          onChange={(e) => updateExercise(day.id, exercise.id, { restSeconds: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempo (optional)</Label>
                        <Input
                          value={exercise.tempo ?? ""}
                          onChange={(e) => updateExercise(day.id, exercise.id, { tempo: e.target.value })}
                          placeholder="2-1-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        rows={2}
                        value={exercise.notes ?? ""}
                        onChange={(e) => updateExercise(day.id, exercise.id, { notes: e.target.value })}
                        placeholder="Form cues, load targets, etc."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={() => addExercise(day.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add exercise
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="shadow-energy" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>

      <ExercisePicker
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        exercises={exercises}
        muscleGroups={muscleGroups}
        tags={tags}
        isLoading={exerciseQuery.isLoading}
        search={search}
        onSearchChange={setSearch}
        muscleFilter={muscleFilter}
        onMuscleFilterChange={setMuscleFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        onSelect={handleExerciseSelect}
      />
    </form>
  );
}

export default WorkoutPlanForm;
