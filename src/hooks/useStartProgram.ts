import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useStartProgram() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      startDate = new Date().toISOString().split("T")[0],
    }: {
      templateId: string;
      startDate?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const data = await api.post('/api/client/start-program', {
        templateId,
        startDate,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["active-programs"] });
      toast.success("Program started! Track your progress in My Programs.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start program");
    },
  });
}

export function useStartDietPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dietPlanId,
      startDate = new Date().toISOString().split("T")[0],
    }: {
      dietPlanId: string;
      startDate?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const data = await api.post('/api/client/start-diet-plan', {
        dietPlanId,
        startDate,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["active-diet-plans"] });
      toast.success("Diet plan started! Track your nutrition in My Plans.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start diet plan");
    },
  });
}
