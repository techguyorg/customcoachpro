import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export interface NutritionLogEntry {
  id: string;
  client_id: string;
  log_date: string;
  meal_type: MealType;
  food_id: string | null;
  recipe_id: string | null;
  custom_food_name: string | null;
  quantity: number;
  unit: string;
  calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  food?: {
    id: string;
    name: string;
    category: string;
  };
  recipe?: {
    id: string;
    name: string;
    category: string;
  };
}

export function useNutritionLog(date?: Date) {
  const { user } = useAuth();
  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["nutrition-log", user?.id, dateStr],
    queryFn: async () => {
      return api.get<NutritionLogEntry[]>(`/api/client/nutrition-log?date=${dateStr}`);
    },
    enabled: !!user?.id,
  });
}

export function useNutritionLogRange(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["nutrition-log-range", user?.id, startStr, endStr],
    queryFn: async () => {
      return api.get<NutritionLogEntry[]>(`/api/client/nutrition-log?startDate=${startStr}&endDate=${endStr}`);
    },
    enabled: !!user?.id,
  });
}

export function useAddNutritionLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      entry: Omit<NutritionLogEntry, "id" | "client_id" | "created_at" | "updated_at" | "food" | "recipe">
    ) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.post<NutritionLogEntry>('/api/client/nutrition-log', entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-log"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-log-range"] });
    },
  });
}

export function useUpdateNutritionLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      entry,
    }: {
      id: string;
      entry: Partial<NutritionLogEntry>;
    }) => {
      return api.put<NutritionLogEntry>(`/api/client/nutrition-log/${id}`, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-log"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-log-range"] });
    },
  });
}

export function useDeleteNutritionLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/client/nutrition-log/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-log"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-log-range"] });
    },
  });
}

// Calculate daily nutrition totals
export function calculateDailyTotals(entries: NutritionLogEntry[]) {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein: acc.protein + (entry.protein_grams || 0),
      carbs: acc.carbs + (entry.carbs_grams || 0),
      fat: acc.fat + (entry.fat_grams || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Group entries by meal type
export function groupByMealType(entries: NutritionLogEntry[]) {
  const groups: Record<MealType, NutritionLogEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    other: [],
  };

  entries.forEach((entry) => {
    groups[entry.meal_type].push(entry);
  });

  return groups;
}
