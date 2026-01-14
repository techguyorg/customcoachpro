import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Exercise } from "@/lib/api";
import { toast } from "sonner";

export interface ExerciseFilters {
  search: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
}

export function useExercises(filters: ExerciseFilters) {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.muscleGroup !== "all") params.append('muscle', filters.muscleGroup);
      if (filters.equipment !== "all") params.append('equipment', filters.equipment);
      if (filters.difficulty !== "all") params.append('difficulty', filters.difficulty);
      
      const queryString = params.toString();
      const endpoint = `/api/exercises${queryString ? `?${queryString}` : ''}`;
      return api.get<Exercise[]>(endpoint);
    },
  });
}

export function useAllExercises() {
  return useQuery({
    queryKey: ["all-exercises"],
    queryFn: async () => {
      return api.get<Exercise[]>('/api/exercises');
    },
  });
}

export function useExercise(id: string | null) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      if (!id) return null;
      return api.get<Exercise>(`/api/exercises/${id}`);
    },
    enabled: !!id,
  });
}

export interface CreateExerciseData {
  name: string;
  primary_muscle: string;
  equipment: string;
  difficulty?: string;
  instructions?: string;
  video_url?: string;
  secondary_muscles?: string[];
  exercise_type?: string;
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateExerciseData) => {
      return api.post<Exercise>('/api/exercises', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["all-exercises"] });
      toast.success("Exercise created successfully!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create exercise");
    },
  });
}

export const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "quadriceps", "hamstrings", "glutes", "calves", "abs", "obliques",
  "lower_back", "traps", "lats"
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const EQUIPMENT_TYPES = [
  "barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell",
  "resistance_band", "ez_bar", "smith_machine", "pull_up_bar", "dip_station",
  "bench", "cardio_machine", "other"
] as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[number];

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const EXERCISE_TYPES = ["compound", "isolation", "cardio", "plyometric", "stretching"] as const;

export type ExerciseTypeValue = typeof EXERCISE_TYPES[number];
