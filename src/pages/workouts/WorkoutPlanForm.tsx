import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { WorkoutPlan } from "@/types";
import type { WorkoutPlanPayload } from "@/services/workoutPlanService";

type WorkoutExerciseForm = {
  id: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  notes?: string;
  order: number;
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
          exerciseName: exercise.exerciseName || exercise.exercise?.name || "",
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          tempo: exercise.tempo,
          notes: exercise.notes,
          order: exercise.order || orderIdx + 1,
        })),
    }));
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
                  exerciseName: "",
                  sets: 3,
                  reps: "10",
                  restSeconds: 90,
                  order: day.exercises.length + 1,
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
                        <Label>Exercise name</Label>
                        <Input
                          value={exercise.exerciseName}
                          onChange={(e) => updateExercise(day.id, exercise.id, { exerciseName: e.target.value })}
                          placeholder="e.g. Bench Press"
                        />
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
    </form>
  );
}

export default WorkoutPlanForm;
