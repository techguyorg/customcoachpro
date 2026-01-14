import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  Calendar,
  Check,
  Trash2,
  Search,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_TYPES, DAYS_PER_WEEK_OPTIONS } from "@/hooks/useWorkoutTemplates";
import { useExercises, useCreateExercise } from "@/hooks/useExercises";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  goal: z.string().max(200).optional(),
  template_type: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  days_per_week: z.number().min(1).max(7),
  duration_weeks: z.number().min(1).max(52),
  is_periodized: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface DayExercise {
  exercise_id?: string;
  exercise_name?: string;
  custom_exercise_name?: string;
  sets_min: number;
  sets_max?: number;
  reps_min: number;
  reps_max?: number;
  notes?: string;
}

interface DayData {
  name: string;
  exercises: DayExercise[];
}

interface WeekData {
  name: string;
  focus?: string;
  days: DayData[];
}

interface WorkoutProgramWizardProps {
  onCreated?: (templateId: string) => void;
  trigger?: React.ReactNode;
}

const STEPS = [
  { id: 1, title: "Basics", description: "Program details" },
  { id: 2, title: "Structure", description: "Weeks & days" },
  { id: 3, title: "Exercises", description: "Add exercises" },
  { id: 4, title: "Review", description: "Confirm & create" },
];

const DAY_NAMES = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Rest"];

export function WorkoutProgramWizard({ onCreated, trigger }: WorkoutProgramWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseMuscle, setNewExerciseMuscle] = useState("chest");
  const [newExerciseEquipment, setNewExerciseEquipment] = useState("barbell");
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      template_type: "",
      difficulty: "intermediate",
      days_per_week: 4,
      duration_weeks: 4,
      is_periodized: false,
    },
  });

  const daysPerWeek = form.watch("days_per_week");
  const durationWeeks = form.watch("duration_weeks");

  // Fetch exercises for picker
  const { data: allExercises } = useExercises({
    search: exerciseSearch,
    muscleGroup: "all",
    equipment: "all",
    difficulty: "all",
  });
  
  const createExercise = useCreateExercise();

  // Initialize weeks structure when moving to step 2
  useEffect(() => {
    if (step === 2 && weeks.length === 0) {
      const newWeeks: WeekData[] = [];
      for (let w = 0; w < durationWeeks; w++) {
        const days: DayData[] = [];
        for (let d = 0; d < daysPerWeek; d++) {
          days.push({
            name: DAY_NAMES[d] || `Day ${d + 1}`,
            exercises: [],
          });
        }
        newWeeks.push({
          name: `Week ${w + 1}`,
          focus: "",
          days,
        });
      }
      setWeeks(newWeeks);
    }
  }, [step, durationWeeks, daysPerWeek]);

  // Update weeks when days/weeks change in step 1
  useEffect(() => {
    if (weeks.length > 0) {
      setWeeks(prev => {
        const newWeeks: WeekData[] = [];
        for (let w = 0; w < durationWeeks; w++) {
          const existingWeek = prev[w];
          const days: DayData[] = [];
          for (let d = 0; d < daysPerWeek; d++) {
            days.push(
              existingWeek?.days[d] || {
                name: DAY_NAMES[d] || `Day ${d + 1}`,
                exercises: [],
              }
            );
          }
          newWeeks.push({
            name: existingWeek?.name || `Week ${w + 1}`,
            focus: existingWeek?.focus || "",
            days,
          });
        }
        return newWeeks;
      });
    }
  }, [durationWeeks, daysPerWeek]);

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!user?.id) throw new Error("Not authenticated");

      const templateData = {
        name: data.name,
        description: data.description || null,
        goal: data.goal || null,
        template_type: data.template_type || null,
        difficulty: data.difficulty,
        days_per_week: data.days_per_week,
        duration_weeks: data.duration_weeks || null,
        is_periodized: data.is_periodized,
        is_system: false,
        weeks: weeks.map((week, weekIndex) => ({
          week_number: weekIndex + 1,
          name: week.name,
          focus: week.focus || null,
          days: week.days.map((day, dayIndex) => ({
            day_number: dayIndex + 1,
            name: day.name,
            exercises: day.exercises.map((ex, exIndex) => ({
              exercise_id: ex.exercise_id || null,
              custom_exercise_name: ex.custom_exercise_name || null,
              sets_min: ex.sets_min,
              sets_max: ex.sets_max || null,
              reps_min: ex.reps_min,
              reps_max: ex.reps_max || null,
              notes: ex.notes || null,
              order_index: exIndex,
            })),
          })),
        })),
      };

      return api.post<{ id: string }>('/api/workouts/templates', templateData);
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["coach-workout-templates"] });
      toast.success("Workout program created successfully!");
      resetWizard();
      onCreated?.(template.id);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create program");
    },
  });

  const resetWizard = () => {
    setOpen(false);
    setStep(1);
    setWeeks([]);
    setSelectedWeek(0);
    setSelectedDay(0);
    form.reset();
  };

  const handleNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(["name", "difficulty", "days_per_week", "duration_weeks"]);
      if (!valid) return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = () => {
    const data = form.getValues();
    createMutation.mutate(data);
  };

  const addExerciseToDay = (exercise: { id?: string; name: string }) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      const day = newWeeks[selectedWeek]?.days[selectedDay];
      if (day) {
        day.exercises.push({
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          sets_min: 3,
          sets_max: 4,
          reps_min: 8,
          reps_max: 12,
        });
      }
      return newWeeks;
    });
    setShowExercisePicker(false);
    setExerciseSearch("");
  };

  const removeExercise = (weekIdx: number, dayIdx: number, exIdx: number) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      newWeeks[weekIdx].days[dayIdx].exercises.splice(exIdx, 1);
      return newWeeks;
    });
  };

  const updateExercise = (weekIdx: number, dayIdx: number, exIdx: number, updates: Partial<DayExercise>) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      newWeeks[weekIdx].days[dayIdx].exercises[exIdx] = {
        ...newWeeks[weekIdx].days[dayIdx].exercises[exIdx],
        ...updates,
      };
      return newWeeks;
    });
  };

  const updateDayName = (weekIdx: number, dayIdx: number, name: string) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      newWeeks[weekIdx].days[dayIdx].name = name;
      return newWeeks;
    });
  };

  const updateWeekInfo = (weekIdx: number, updates: Partial<WeekData>) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      newWeeks[weekIdx] = { ...newWeeks[weekIdx], ...updates };
      return newWeeks;
    });
  };

  const copyWeek = (sourceWeekIdx: number) => {
    if (weeks.length <= 1) return;
    setWeeks(prev => {
      const newWeeks = [...prev];
      const sourceDays = JSON.parse(JSON.stringify(prev[sourceWeekIdx].days));
      for (let i = 0; i < newWeeks.length; i++) {
        if (i !== sourceWeekIdx) {
          newWeeks[i].days = JSON.parse(JSON.stringify(sourceDays));
        }
      }
      return newWeeks;
    });
    toast.success("Copied to all weeks");
  };

  const totalExercises = weeks.reduce(
    (sum, week) => sum + week.days.reduce((dSum, day) => dSum + day.exercises.length, 0),
    0
  );

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : resetWizard()}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Program
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with Steps */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Create Workout Program</DialogTitle>
            <DialogDescription>
              Build a complete program with exercises for each day
            </DialogDescription>
          </DialogHeader>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6" style={{ maxHeight: "calc(90vh - 220px)" }}>
          <Form {...form}>
            <form className="space-y-6 py-6">
              {/* Step 1: Basics */}
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 12-Week Strength Builder" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Build strength and muscle mass" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the program..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="template_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TEMPLATE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {formatLabel(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration_weeks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (weeks) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={52}
                              placeholder="e.g., 8"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="days_per_week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days Per Week *</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS_PER_WEEK_OPTIONS.map((days) => (
                                <SelectItem key={days} value={days.toString()}>
                                  {days} days
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_periodized"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="font-medium">Periodized Program</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Program varies week-to-week with progressive overload
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Structure (Name days/weeks) */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Name your weeks and training days. You'll add exercises in the next step.
                  </p>
                  
                  {weeks.map((week, weekIdx) => (
                    <Card key={weekIdx}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Week {weekIdx + 1}</Badge>
                          <Input
                            value={week.name}
                            onChange={(e) => updateWeekInfo(weekIdx, { name: e.target.value })}
                            placeholder="Week name"
                            className="flex-1 h-8"
                          />
                          <Input
                            value={week.focus || ""}
                            onChange={(e) => updateWeekInfo(weekIdx, { focus: e.target.value })}
                            placeholder="Focus (optional)"
                            className="flex-1 h-8"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {week.days.map((day, dayIdx) => (
                            <div 
                              key={dayIdx} 
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                            >
                              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                              <Input
                                value={day.name}
                                onChange={(e) => updateDayName(weekIdx, dayIdx, e.target.value)}
                                placeholder={`Day ${dayIdx + 1}`}
                                className="h-7 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 3: Exercises */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Add exercises to each day. Select a week and day below.
                    </p>
                    {weeks.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyWeek(selectedWeek)}
                      >
                        Copy Week {selectedWeek + 1} to All
                      </Button>
                    )}
                  </div>

                  {/* Week/Day Selector */}
                  <div className="flex gap-2 flex-wrap">
                    {weeks.map((week, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant={selectedWeek === idx ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setSelectedWeek(idx); setSelectedDay(0); }}
                      >
                        Week {idx + 1}
                      </Button>
                    ))}
                  </div>

                  {weeks[selectedWeek] && (
                    <div className="flex gap-2 flex-wrap">
                      {weeks[selectedWeek].days.map((day, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant={selectedDay === idx ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedDay(idx)}
                        >
                          {day.name}
                          {day.exercises.length > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {day.exercises.length}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Current Day Exercises */}
                  {weeks[selectedWeek]?.days[selectedDay] && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{weeks[selectedWeek].days[selectedDay].name}</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowExercisePicker(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Exercise
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4">
                        {weeks[selectedWeek].days[selectedDay].exercises.length > 0 ? (
                          <div className="space-y-2">
                            {weeks[selectedWeek].days[selectedDay].exercises.map((ex, exIdx) => (
                              <div 
                                key={exIdx} 
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                              >
                                <span className="text-muted-foreground text-sm w-6">
                                  {exIdx + 1}.
                                </span>
                                <Dumbbell className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1 font-medium text-sm">
                                  {ex.exercise_name || ex.custom_exercise_name || "Custom"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={ex.sets_min}
                                    onChange={(e) => updateExercise(selectedWeek, selectedDay, exIdx, { sets_min: parseInt(e.target.value) || 3 })}
                                    className="w-14 h-7 text-center text-sm"
                                    min={1}
                                  />
                                  <span className="text-muted-foreground">×</span>
                                  <Input
                                    type="number"
                                    value={ex.reps_min}
                                    onChange={(e) => updateExercise(selectedWeek, selectedDay, exIdx, { reps_min: parseInt(e.target.value) || 8 })}
                                    className="w-14 h-7 text-center text-sm"
                                    min={1}
                                  />
                                  <span className="text-muted-foreground text-sm">-</span>
                                  <Input
                                    type="number"
                                    value={ex.reps_max || ""}
                                    onChange={(e) => updateExercise(selectedWeek, selectedDay, exIdx, { reps_max: parseInt(e.target.value) || undefined })}
                                    className="w-14 h-7 text-center text-sm"
                                    placeholder="max"
                                    min={1}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeExercise(selectedWeek, selectedDay, exIdx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No exercises added yet</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => setShowExercisePicker(true)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add First Exercise
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Exercise Picker Modal */}
                  {showExercisePicker && !showCreateExercise && (
                    <Card className="border-2 border-primary">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">Select Exercise</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4">
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search exercises..."
                            value={exerciseSearch}
                            onChange={(e) => setExerciseSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <ScrollArea className="h-48">
                          <div className="space-y-1">
                            {allExercises?.map((ex) => (
                              <Button
                                key={ex.id}
                                type="button"
                                variant="ghost"
                                className="w-full justify-start h-auto py-2"
                                onClick={() => addExerciseToDay({ id: ex.id, name: ex.name })}
                              >
                                <Dumbbell className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="flex-1 text-left">{ex.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {ex.primary_muscle}
                                </Badge>
                              </Button>
                            ))}
                            {(!allExercises || allExercises.length === 0) && exerciseSearch && (
                              <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-2">
                                  No exercises found for "{exerciseSearch}"
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNewExerciseName(exerciseSearch);
                                    setShowCreateExercise(true);
                                  }}
                                >
                                  <PlusCircle className="w-4 h-4 mr-1" />
                                  Create "{exerciseSearch}"
                                </Button>
                              </div>
                            )}
                            {(!allExercises || allExercises.length === 0) && !exerciseSearch && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No exercises found. Type to search or create new.
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                        <div className="mt-4 flex justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewExerciseName("");
                              setShowCreateExercise(true);
                            }}
                          >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            Create New Exercise
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => { setShowExercisePicker(false); setExerciseSearch(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Create New Exercise Form */}
                  {showExercisePicker && showCreateExercise && (
                    <Card className="border-2 border-primary">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">Create New Exercise</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4 space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Exercise Name *</label>
                          <Input
                            placeholder="e.g., Incline Dumbbell Press"
                            value={newExerciseName}
                            onChange={(e) => setNewExerciseName(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Muscle *</label>
                            <Select value={newExerciseMuscle} onValueChange={setNewExerciseMuscle}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["chest", "back", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "calves", "abs", "forearms", "traps", "lats"].map(muscle => (
                                  <SelectItem key={muscle} value={muscle}>
                                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Equipment *</label>
                            <Select value={newExerciseEquipment} onValueChange={setNewExerciseEquipment}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "resistance_band", "other"].map(equip => (
                                  <SelectItem key={equip} value={equip}>
                                    {equip.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCreateExercise(false);
                              setNewExerciseName("");
                            }}
                          >
                            Back
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!newExerciseName.trim() || createExercise.isPending}
                            onClick={async () => {
                              const created = await createExercise.mutateAsync({
                                name: newExerciseName.trim(),
                                primary_muscle: newExerciseMuscle,
                                equipment: newExerciseEquipment,
                                difficulty: "intermediate",
                              });
                              if (created?.id) {
                                addExerciseToDay({ id: created.id, name: created.name });
                                setShowCreateExercise(false);
                                setNewExerciseName("");
                              }
                            }}
                          >
                            {createExercise.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Plus className="w-4 h-4 mr-1" />
                            )}
                            Create & Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-lg">{form.getValues("name")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{durationWeeks}</p>
                          <p className="text-xs text-muted-foreground">Weeks</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{daysPerWeek}</p>
                          <p className="text-xs text-muted-foreground">Days/Week</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{totalExercises}</p>
                          <p className="text-xs text-muted-foreground">Total Exercises</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold capitalize">{form.getValues("difficulty")}</p>
                          <p className="text-xs text-muted-foreground">Difficulty</p>
                        </div>
                      </div>

                      {form.getValues("description") && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {form.getValues("description")}
                        </p>
                      )}

                      <div className="space-y-3">
                        {weeks.slice(0, 2).map((week, weekIdx) => (
                          <div key={weekIdx} className="border rounded-lg p-3">
                            <h4 className="font-medium mb-2">{week.name}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {week.days.map((day, dayIdx) => (
                                <div key={dayIdx} className="text-sm bg-muted/50 p-2 rounded">
                                  <span className="font-medium">{day.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({day.exercises.length} exercises)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {weeks.length > 2 && (
                          <p className="text-sm text-muted-foreground text-center">
                            + {weeks.length - 2} more weeks...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-between gap-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? () => setOpen(false) : handleBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          {step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Program
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
