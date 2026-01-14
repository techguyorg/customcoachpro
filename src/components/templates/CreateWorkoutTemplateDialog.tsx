import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_TYPES, DAYS_PER_WEEK_OPTIONS } from "@/hooks/useWorkoutTemplates";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  goal: z.string().max(200).optional(),
  template_type: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  days_per_week: z.number().min(1).max(7),
  duration_weeks: z.number().min(1).max(52).optional(),
  is_periodized: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface WorkoutTemplateData {
  id?: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  template_type?: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  days_per_week: number;
  duration_weeks?: number | null;
  is_periodized: boolean;
}

interface CreateWorkoutTemplateDialogProps {
  onCreated?: (templateId: string) => void;
  initialData?: WorkoutTemplateData | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isSystemContent?: boolean;
}

export function CreateWorkoutTemplateDialog({ onCreated, initialData, open: controlledOpen, onOpenChange, isSystemContent = false }: CreateWorkoutTemplateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      template_type: "",
      difficulty: "intermediate",
      days_per_week: 4,
      duration_weeks: undefined,
      is_periodized: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        goal: initialData.goal || "",
        template_type: initialData.template_type || "",
        difficulty: initialData.difficulty || "intermediate",
        days_per_week: initialData.days_per_week || 4,
        duration_weeks: initialData.duration_weeks || undefined,
        is_periodized: initialData.is_periodized || false,
      });
    } else if (!open) {
      form.reset();
    }
  }, [initialData, open, form]);

  const saveMutation = useMutation({
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
      };

      if (isEditing && initialData?.id) {
        return api.put<{ id: string }>(`/api/workouts/templates/${initialData.id}`, templateData);
      } else {
        return api.post<{ id: string }>('/api/workouts/templates', { ...templateData, is_system: isSuperAdmin && isSystemContent });
      }
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["coach-workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-workout-templates"] });
      toast.success(isEditing ? "Workout template updated!" : "Workout template created!");
      form.reset();
      setOpen(false);
      onCreated?.(template.id);
    },
    onError: (error) => {
      console.error(error);
      toast.error(isEditing ? "Failed to update template" : "Failed to create template");
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    saveMutation.mutate(data);
  };

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Workout Program" : "Create Workout Program"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the workout program details" : "Create a custom workout program for yourself or your clients"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Describe the program, who it's for, and what to expect..."
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

              <FormField
                control={form.control}
                name="duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        placeholder="e.g., 8"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Program"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
