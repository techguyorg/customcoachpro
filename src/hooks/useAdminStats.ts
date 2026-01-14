import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlatformStats {
  totalUsers: number;
  totalCoaches: number;
  totalClients: number;
  totalAdmins: number;
  activeCoachings: number;
  pendingRequests: number;
  systemExercises: number;
  systemWorkoutTemplates: number;
  systemDietPlans: number;
  systemRecipes: number;
  systemFoods: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      return api.get<PlatformStats>('/api/admin/stats');
    },
  });
}
