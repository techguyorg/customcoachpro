import { useQuery } from "@tanstack/react-query";
import { api, WorkoutTemplate, WorkoutWeek, WorkoutDay, WorkoutExercise } from "@/lib/api";

export interface TemplateWithStats extends WorkoutTemplate {
  week_count?: number;
  day_count?: number;
  exercise_count?: number;
}

export interface TemplateFilters {
  search: string;
  templateType: string;
  difficulty: string;
  daysPerWeek: number | "all";
}

export function useWorkoutTemplates(filters: TemplateFilters) {
  return useQuery({
    queryKey: ["workout-templates", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.difficulty !== "all") params.append('difficulty', filters.difficulty);
      if (filters.daysPerWeek !== "all") params.append('days_per_week', String(filters.daysPerWeek));
      if (filters.templateType !== "all") params.append('goal', filters.templateType);
      
      const queryString = params.toString();
      const endpoint = `/api/workouts/templates${queryString ? `?${queryString}` : ''}`;
      return api.get<TemplateWithStats[]>(endpoint);
    },
  });
}

export interface TemplateWeek extends WorkoutWeek {}
export interface TemplateDay extends WorkoutDay {}
export interface TemplateExercise extends WorkoutExercise {
  exercise?: {
    id: string;
    name: string;
    primary_muscle: string;
    equipment: string;
    difficulty: string;
  };
}

export function useWorkoutTemplateDetail(id: string | null) {
  return useQuery({
    queryKey: ["workout-template-detail", id],
    queryFn: async () => {
      if (!id) return null;
      return api.get<WorkoutTemplate & { weeks: TemplateWeek[]; total_exercises?: number }>(`/api/workouts/templates/${id}`);
    },
    enabled: !!id,
  });
}

export const TEMPLATE_TYPES = [
  "push_pull_legs", "upper_lower", "full_body", "bro_split", "strength",
  "hypertrophy", "powerbuilding", "sport_specific", "cardio_conditioning",
  "functional", "bodyweight", "beginner",
];

export const DAYS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6, 7];
