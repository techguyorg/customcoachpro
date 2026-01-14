import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, X, Dumbbell } from "lucide-react";
import { 
  MUSCLE_GROUPS, EQUIPMENT_TYPES, DIFFICULTY_LEVELS, EXERCISE_TYPES,
  type MuscleGroup, type EquipmentType, type DifficultyLevel, type ExerciseTypeValue 
} from "@/hooks/useExercises";

type ExerciseType = ExerciseTypeValue;

const formatLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

interface ExerciseData {
  id?: string;
  name: string;
  description?: string | null;
  primary_muscle: MuscleGroup;
  secondary_muscles?: MuscleGroup[] | null;
  equipment: EquipmentType;
  difficulty: DifficultyLevel;
  exercise_type: ExerciseType;
  instructions?: string[] | null;
  tips?: string[] | null;
  common_mistakes?: string[] | null;
  video_url?: string | null;
}

interface CreateExerciseDialogProps {
  trigger?: React.ReactNode;
  initialData?: ExerciseData | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateExerciseDialog({ trigger, initialData, open: controlledOpen, onOpenChange }: CreateExerciseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    primary_muscle: "" as MuscleGroup | "",
    secondary_muscles: [] as MuscleGroup[],
    equipment: "" as EquipmentType | "",
    difficulty: "intermediate" as DifficultyLevel,
    exercise_type: "compound" as ExerciseType,
    instructions: [""],
    tips: [""],
    common_mistakes: [""],
    video_url: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData && open) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        primary_muscle: initialData.primary_muscle || "",
        secondary_muscles: initialData.secondary_muscles || [],
        equipment: initialData.equipment || "",
        difficulty: initialData.difficulty || "intermediate",
        exercise_type: initialData.exercise_type || "compound",
        instructions: initialData.instructions?.length ? initialData.instructions : [""],
        tips: initialData.tips?.length ? initialData.tips : [""],
        common_mistakes: initialData.common_mistakes?.length ? initialData.common_mistakes : [""],
        video_url: initialData.video_url || "",
      });
    } else if (!open) {
      resetForm();
    }
  }, [initialData, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const exerciseData = {
        name: data.name,
        description: data.description || null,
        primary_muscle: data.primary_muscle as MuscleGroup,
        secondary_muscles: data.secondary_muscles.length > 0 ? data.secondary_muscles : null,
        equipment: data.equipment as EquipmentType,
        difficulty: data.difficulty,
        exercise_type: data.exercise_type,
        instructions: data.instructions.filter((i) => i.trim()),
        tips: data.tips.filter((t) => t.trim()),
        common_mistakes: data.common_mistakes.filter((m) => m.trim()),
        video_url: data.video_url || null,
      };

      if (isEditing && initialData?.id) {
        return api.put(`/api/exercises/${initialData.id}`, exerciseData);
      } else {
        return api.post('/api/exercises', { ...exerciseData, is_system: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
      toast({ title: isEditing ? "Exercise updated successfully!" : "Exercise created successfully!" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Failed to update exercise" : "Failed to create exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      primary_muscle: "",
      secondary_muscles: [],
      equipment: "",
      difficulty: "intermediate",
      exercise_type: "compound",
      instructions: [""],
      tips: [""],
      common_mistakes: [""],
      video_url: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.primary_muscle || !formData.equipment) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, primary muscle, and equipment.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) =>
        i === index ? value : inst
      ),
    }));
  };

  const addTip = () => {
    setFormData((prev) => ({ ...prev, tips: [...prev.tips, ""] }));
  };

  const removeTip = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index),
    }));
  };

  const updateTip = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tips: prev.tips.map((tip, i) => (i === index ? value : tip)),
    }));
  };

  const toggleSecondaryMuscle = (muscle: MuscleGroup) => {
    setFormData((prev) => ({
      ...prev,
      secondary_muscles: prev.secondary_muscles.includes(muscle)
        ? prev.secondary_muscles.filter((m) => m !== muscle)
        : [...prev.secondary_muscles, muscle],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {isEditing ? "Edit Exercise" : "Create Custom Exercise"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Exercise Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Incline Dumbbell Press"
                required
              />
            </div>

            <div>
              <Label>Primary Muscle *</Label>
              <Select
                value={formData.primary_muscle}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    primary_muscle: value as MuscleGroup,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select muscle" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((muscle) => (
                    <SelectItem key={muscle} value={muscle}>
                      {formatLabel(muscle)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Equipment *</Label>
              <Select
                value={formData.equipment}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    equipment: value as EquipmentType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {formatLabel(eq)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficulty: value as DifficultyLevel,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {formatLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Exercise Type</Label>
              <Select
                value={formData.exercise_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    exercise_type: value as ExerciseType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Secondary Muscles */}
          <div>
            <Label className="mb-2 block">Secondary Muscles</Label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.filter((m) => m !== formData.primary_muscle).map(
                (muscle) => (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleSecondaryMuscle(muscle)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      formData.secondary_muscles.includes(muscle)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border hover:border-primary/50"
                    }`}
                  >
                    {formatLabel(muscle)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of the exercise..."
              rows={2}
            />
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Instructions</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addInstruction}>
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-9 flex items-center justify-center text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <Input
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Step ${index + 1}...`}
                  />
                  {formData.instructions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstruction(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Pro Tips</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addTip}>
                <Plus className="w-4 h-4 mr-1" />
                Add Tip
              </Button>
            </div>
            <div className="space-y-2">
              {formData.tips.map((tip, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tip}
                    onChange={(e) => updateTip(index, e.target.value)}
                    placeholder="Add a helpful tip..."
                  />
                  {formData.tips.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTip(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Video URL */}
          <div>
            <Label htmlFor="video_url">Video URL (YouTube or direct link)</Label>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, video_url: e.target.value }))
              }
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {/* Common Mistakes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Common Mistakes</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((prev) => ({ ...prev, common_mistakes: [...prev.common_mistakes, ""] }))}>
                <Plus className="w-4 h-4 mr-1" />
                Add Mistake
              </Button>
            </div>
            <div className="space-y-2">
              {formData.common_mistakes.map((mistake, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={mistake}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      common_mistakes: prev.common_mistakes.map((m, i) => i === index ? e.target.value : m)
                    }))}
                    placeholder="Describe a common mistake..."
                  />
                  {formData.common_mistakes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        common_mistakes: prev.common_mistakes.filter((_, i) => i !== index)
                      }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Create Exercise"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
