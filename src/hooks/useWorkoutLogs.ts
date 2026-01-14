import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SetData {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutLogExercise {
  id: string;
  workout_log_id: string;
  exercise_id: string | null;
  exercise_name: string;
  sets_completed: number;
  set_data: SetData[] | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  exercise?: {
    id: string;
    name: string;
    primary_muscle: string;
    equipment: string;
  } | null;
}

export interface WorkoutLog {
  id: string;
  client_id: string;
  template_id: string | null;
  template_day_id: string | null;
  assignment_id: string | null;
  workout_date: string;
  started_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  perceived_effort: number | null;
  satisfaction_rating: number | null;
  created_at: string;
  updated_at: string;
  workout_template?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  template_day?: {
    id: string;
    name: string;
    day_number: number;
  } | null;
  exercises?: WorkoutLogExercise[];
}

export function useWorkoutLogs(clientId?: string) {
  const { user } = useAuth();
  const targetId = clientId || user?.id;

  return useQuery({
    queryKey: ["workout-logs", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const endpoint = clientId ? `/api/coach/clients/${clientId}/workout-logs` : '/api/client/workout-logs';
      const data = await api.get<WorkoutLog[]>(endpoint);
      return data;
    },
    enabled: !!targetId,
  });
}

export function useWorkoutLogDetail(logId: string | null) {
  return useQuery({
    queryKey: ["workout-log-detail", logId],
    queryFn: async () => {
      if (!logId) return null;
      const data = await api.get<WorkoutLog>(`/api/workouts/logs/${logId}`);
      return data;
    },
    enabled: !!logId,
  });
}

export function useCreateWorkoutLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      templateId,
      templateDayId,
      assignmentId,
      workoutDate,
      preloadExercises = true,
    }: {
      templateId?: string;
      templateDayId?: string;
      assignmentId?: string;
      workoutDate?: string;
      preloadExercises?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const data = await api.post<WorkoutLog>('/api/workouts/logs', {
        templateId,
        templateDayId,
        assignmentId,
        workoutDate: workoutDate || new Date().toISOString().split('T')[0],
        preloadExercises,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create workout log");
    },
  });
}

export function useUpdateWorkoutLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      status?: string;
      completed_at?: string;
      duration_minutes?: number;
      notes?: string;
      perceived_effort?: number;
      satisfaction_rating?: number;
    }) => {
      const data = await api.put<WorkoutLog>(`/api/workouts/logs/${id}`, updates);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["workout-log-detail", variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update workout log");
    },
  });
}

export function useAddWorkoutExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutLogId,
      exerciseId,
      exerciseName,
      orderIndex,
    }: {
      workoutLogId: string;
      exerciseId?: string;
      exerciseName: string;
      orderIndex: number;
    }) => {
      const data = await api.post(`/api/workouts/logs/${workoutLogId}/exercises`, {
        exerciseId,
        exerciseName,
        orderIndex,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-log-detail", variables.workoutLogId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add exercise");
    },
  });
}

export function useUpdateWorkoutExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      workoutLogId,
      setsCompleted,
      setData,
      notes,
    }: {
      id: string;
      workoutLogId: string;
      setsCompleted?: number;
      setData?: SetData[];
      notes?: string;
    }) => {
      const data = await api.put(`/api/workouts/logs/exercises/${id}`, {
        setsCompleted,
        setData,
        notes,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workout-log-detail", variables.workoutLogId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update exercise");
    },
  });
}

export function useDeleteWorkoutLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/workouts/logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
      toast.success("Workout deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete workout");
    },
  });
}

export function useWorkoutStats(clientId?: string) {
  const { user } = useAuth();
  const targetId = clientId || user?.id;

  return useQuery({
    queryKey: ["workout-stats", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const endpoint = clientId ? `/api/coach/clients/${clientId}/workout-stats` : '/api/client/workout-stats';
      const data = await api.get<{
        workoutsThisWeek: number;
        totalMinutesThisWeek: number;
        currentStreak: number;
        totalWorkouts: number;
      }>(endpoint);
      return data;
    },
    enabled: !!targetId,
  });
}
