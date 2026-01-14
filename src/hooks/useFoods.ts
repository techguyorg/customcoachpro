import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Food } from "@/lib/api";

// Re-export Food type
export type { Food };

// Calculate calories from macros: P×4 + C×4 + F×9
export function calculateCalories(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

// Serving unit conversion factors (to grams equivalent for per-100g calculations)
// For piece/serving units, we use the food's default_serving_size if available
export const SERVING_UNITS = {
  g: { label: "grams", toGrams: 1 },
  ml: { label: "milliliters", toGrams: 1 }, // Approximate 1:1 for liquids
  oz: { label: "ounces", toGrams: 28.35 },
  lb: { label: "pounds", toGrams: 453.6 },
  cup: { label: "cups", toGrams: 240 }, // Approximate for most foods
  tbsp: { label: "tablespoons", toGrams: 15 },
  tsp: { label: "teaspoons", toGrams: 5 },
  piece: { label: "pieces", toGrams: null }, // Uses default_serving_size
  serving: { label: "servings", toGrams: null }, // Uses default_serving_size
  slice: { label: "slices", toGrams: 30 }, // Approximate
  scoop: { label: "scoops", toGrams: 30 }, // Typical protein scoop
};

// Calculate nutrition for a given quantity with support for multiple units
export function calculateNutrition(
  food: Food,
  quantity: number,
  unit: string = "g"
): { calories: number; protein: number; carbs: number; fat: number; fiber: number } {
  let grams = quantity;
  
  const unitConfig = SERVING_UNITS[unit as keyof typeof SERVING_UNITS];
  
  if (unitConfig) {
    if (unitConfig.toGrams === null) {
      // For piece/serving units, use the food's default serving size
      // The macro values are then per serving, not per 100g
      const servingSize = food.default_serving_size || 100;
      grams = quantity * servingSize;
    } else {
      grams = quantity * unitConfig.toGrams;
    }
  }

  const multiplier = grams / 100;
  const protein = Math.round((food.protein_per_100g || 0) * multiplier * 10) / 10;
  const carbs = Math.round((food.carbs_per_100g || 0) * multiplier * 10) / 10;
  const fat = Math.round((food.fat_per_100g || 0) * multiplier * 10) / 10;
  const fiber = Math.round((food.fiber_per_100g || 0) * multiplier * 10) / 10;
  const calories = calculateCalories(protein, carbs, fat);

  return { calories, protein, carbs, fat, fiber };
}

// Get available units for a food (based on its default unit type)
export function getAvailableUnits(food: Food): string[] {
  const defaultUnit = food.default_serving_unit || "g";
  const allUnits = ["g", "oz", "serving", "piece", "cup", "tbsp", "tsp"];
  
  // Always include the default unit first
  if (!allUnits.includes(defaultUnit)) {
    allUnits.unshift(defaultUnit);
  } else {
    // Move default to front
    const idx = allUnits.indexOf(defaultUnit);
    allUnits.splice(idx, 1);
    allUnits.unshift(defaultUnit);
  }
  
  return allUnits;
}

export function useFoods(searchQuery?: string, category?: string) {
  return useQuery({
    queryKey: ["foods", searchQuery, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.length >= 2) params.append('search', searchQuery);
      if (category) params.append('category', category);
      
      const queryString = params.toString();
      const endpoint = `/api/foods${queryString ? `?${queryString}` : ''}`;
      return api.get<Food[]>(endpoint);
    },
    enabled: !searchQuery || searchQuery.length >= 2,
  });
}

export function useFoodCategories() {
  return useQuery({
    queryKey: ["food-categories"],
    queryFn: async () => {
      const data = await api.get<{ category: string; count: number }[]>('/api/foods/categories');
      return data.map(d => d.category).sort();
    },
  });
}

export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (food: Omit<Food, "id" | "created_at" | "updated_at" | "created_by"> & { is_system?: boolean }) => {
      return api.post<Food>('/api/foods', food);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      queryClient.invalidateQueries({ queryKey: ["admin-foods"] });
    },
  });
}

export function useUpdateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, food }: { id: string; food: Partial<Food> }) => {
      return api.put<Food>(`/api/foods/${id}`, food);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });
}

export function useDeleteFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/foods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });
}
