import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  workoutsThisWeek: number;
  totalWorkoutMinutes: number;
  caloriesLogged: number;
  currentStreak: number;
  nextCheckinDate: string | null;
  hasActiveWorkoutPlan: boolean;
  hasActiveDietPlan: boolean;
  todaysWorkout: {
    id: string;
    name: string;
    dayNumber: number;
  } | null;
  todaysDiet: {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        return getEmptyStats();
      }

      try {
        return await api.get<DashboardStats>('/api/client/dashboard-stats');
      } catch {
        return getEmptyStats();
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

function getEmptyStats(): DashboardStats {
  return {
    workoutsThisWeek: 0,
    totalWorkoutMinutes: 0,
    caloriesLogged: 0,
    currentStreak: 0,
    nextCheckinDate: null,
    hasActiveWorkoutPlan: false,
    hasActiveDietPlan: false,
    todaysWorkout: null,
    todaysDiet: null,
  };
}
