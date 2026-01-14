import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Recipe, RecipeIngredient } from "@/lib/api";
import { calculateCalories } from "./useFoods";

// Re-export types
export type { Recipe, RecipeIngredient };

// Calculate recipe totals from ingredients
export function calculateRecipeTotals(
  ingredients: Array<{
    quantity: number;
    unit: string;
    food: { protein_per_100g: number | null; carbs_per_100g: number | null; fat_per_100g: number | null; default_serving_size?: number | null };
  }>
): { calories: number; protein: number; carbs: number; fat: number } {
  let protein = 0, carbs = 0, fat = 0;

  for (const ing of ingredients) {
    let grams = ing.quantity;
    if (ing.unit === "oz") grams = ing.quantity * 28.35;
    if (ing.unit === "lb") grams = ing.quantity * 453.6;
    if (ing.unit === "serving" && ing.food.default_serving_size) grams = ing.food.default_serving_size;

    const multiplier = grams / 100;
    protein += (ing.food.protein_per_100g || 0) * multiplier;
    carbs += (ing.food.carbs_per_100g || 0) * multiplier;
    fat += (ing.food.fat_per_100g || 0) * multiplier;
  }

  return { calories: calculateCalories(protein, carbs, fat), protein: Math.round(protein * 10) / 10, carbs: Math.round(carbs * 10) / 10, fat: Math.round(fat * 10) / 10 };
}

export function useRecipes(searchQuery?: string) {
  return useQuery({
    queryKey: ["recipes", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.length >= 2) params.append('search', searchQuery);
      const queryString = params.toString();
      return api.get<Recipe[]>(`/api/recipes${queryString ? `?${queryString}` : ''}`);
    },
    enabled: !searchQuery || searchQuery.length >= 2,
  });
}

export function useRecipeWithIngredients(recipeId?: string) {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      return api.get<Recipe>(`/api/recipes/${recipeId}`);
    },
    enabled: !!recipeId,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipe, ingredients }: { recipe: Partial<Recipe>; ingredients: Array<{ food_id: string; quantity: number; unit: string; notes?: string }> }) => {
      return api.post<Recipe>('/api/recipes', { ...recipe, ingredients });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, recipe, ingredients }: { id: string; recipe: Partial<Recipe>; ingredients?: Array<{ food_id: string; quantity: number; unit: string; notes?: string }> }) => {
      return api.put<Recipe>(`/api/recipes/${id}`, { ...recipe, ingredients });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
