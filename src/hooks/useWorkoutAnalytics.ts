import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface WorkoutAnalytics {
  weeklyVolume: {
    week: string;
    totalSets: number;
    totalReps: number;
    totalWeight: number;
  }[];
  weeklyFrequency: {
    week: string;
    workouts: number;
  }[];
  muscleDistribution: {
    muscle: string;
    count: number;
  }[];
  progressMetrics: {
    totalWorkouts: number;
    avgWorkoutDuration: number;
    avgExercisesPerWorkout: number;
    currentStreak: number;
    longestStreak: number;
    mostActiveDay: string;
  };
}

export function useWorkoutAnalytics(days = 90) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workout-analytics", user?.id, days],
    queryFn: async (): Promise<WorkoutAnalytics> => {
      if (!user?.id) throw new Error("Not authenticated");
      const data = await api.get<WorkoutAnalytics>(`/api/client/workout-analytics?days=${days}`);
      return data;
    },
    enabled: !!user?.id,
  });
}
