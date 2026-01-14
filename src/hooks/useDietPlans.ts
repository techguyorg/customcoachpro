import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, DietPlan, DietPlanMeal } from "@/lib/api";

// Re-export types
export type { DietPlan, DietPlanMeal };

export function useDietPlans() {
  return useQuery({
    queryKey: ["diet-plans"],
    queryFn: async () => {
      return api.get<DietPlan[]>('/api/diet/plans');
    },
  });
}

export function useDietPlanWithMeals(planId?: string) {
  return useQuery({
    queryKey: ["diet-plan", planId],
    queryFn: async () => {
      if (!planId) return null;
      return api.get<DietPlan>(`/api/diet/plans/${planId}`);
    },
    enabled: !!planId,
  });
}

export function useCreateDietPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ plan, meals }: { plan: Omit<DietPlan, "id" | "created_at" | "updated_at" | "created_by" | "meals">; meals?: Omit<DietPlanMeal, "id" | "plan_id" | "created_at">[] }) => {
      return api.post<DietPlan>('/api/diet/plans', { ...plan, meals });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
    },
  });
}

export function useUpdateDietPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, plan, meals }: { id: string; plan: Partial<DietPlan>; meals?: Omit<DietPlanMeal, "id" | "plan_id" | "created_at">[] }) => {
      return api.put<DietPlan>(`/api/diet/plans/${id}`, { ...plan, meals });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["diet-plan", variables.id] });
    },
  });
}

export function useDeleteDietPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/diet/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
    },
  });
}
