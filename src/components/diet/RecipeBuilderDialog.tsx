import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Flame, Beef, Wheat, Droplet, Clock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import { useCreateRecipe, useUpdateRecipe, Recipe, calculateRecipeTotals } from "@/hooks/useRecipes";
import { Food, calculateNutrition } from "@/hooks/useFoods";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prep_time_minutes: z.number().optional(),
  cook_time_minutes: z.number().optional(),
  servings: z.number().min(1).default(1),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface IngredientItem {
  id: string;
  food: Food;
  quantity: number;
  unit: string;
  notes?: string;
}

const UNITS = [
  { value: "g", label: "grams" },
  { value: "oz", label: "ounces" },
  { value: "serving", label: "serving" },
  { value: "piece", label: "piece" },
  { value: "cup", label: "cup" },
  { value: "tbsp", label: "tablespoon" },
  { value: "tsp", label: "teaspoon" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecipe?: Recipe | null;
  isSystemContent?: boolean;
}

export function RecipeBuilderDialog({ open, onOpenChange, editingRecipe, isSystemContent = false }: Props) {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>("g");

  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      servings: 1,
      tags: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingRecipe && open) {
      form.reset({
        name: editingRecipe.name,
        description: editingRecipe.description || "",
        instructions: editingRecipe.instructions || "",
        prep_time_minutes: editingRecipe.prep_time_minutes || undefined,
        cook_time_minutes: editingRecipe.cook_time_minutes || undefined,
        servings: editingRecipe.servings || 1,
        tags: editingRecipe.category || "",
      });
      // Populate ingredients if available
      if (editingRecipe.ingredients) {
        setIngredients(editingRecipe.ingredients.map(ing => ({
          id: ing.id,
          food: ing.food as unknown as Food,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || undefined,
        })).filter(ing => ing.food));
      }
    } else if (!open) {
      form.reset();
      setIngredients([]);
    }
  }, [editingRecipe, open, form]);

  const addIngredient = () => {
    if (!selectedFood) return;

    const newItem: IngredientItem = {
      id: crypto.randomUUID(),
      food: selectedFood,
      quantity,
      unit,
    };

    setIngredients([...ingredients, newItem]);
    setSelectedFood(null);
    setQuantity(100);
    setUnit("g");
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  const updateIngredient = (id: string, updates: Partial<IngredientItem>) => {
    setIngredients(
      ingredients.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Calculate totals
  const totals = ingredients.length > 0
    ? calculateRecipeTotals(
        ingredients.map((ing) => ({
          quantity: ing.quantity,
          unit: ing.unit,
          food: {
            protein_per_100g: ing.food.protein_per_100g,
            carbs_per_100g: ing.food.carbs_per_100g,
            fat_per_100g: ing.food.fat_per_100g,
            default_serving_size: ing.food.default_serving_size,
          },
        }))
      )
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const servings = form.watch("servings") || 1;
  const perServing = {
    calories: Math.round(totals.calories / servings),
    protein: Math.round((totals.protein / servings) * 10) / 10,
    carbs: Math.round((totals.carbs / servings) * 10) / 10,
    fat: Math.round((totals.fat / servings) * 10) / 10,
  };

  const onSubmit = async (data: FormData) => {
    if (ingredients.length === 0) {
      toast.error("Add at least one ingredient");
      return;
    }

    try {
      const recipeData = {
        name: data.name,
        description: data.description || null,
        instructions: data.instructions || null,
        prep_time_minutes: data.prep_time_minutes || null,
        cook_time_minutes: data.cook_time_minutes || null,
        servings: data.servings,
        calories_per_serving: perServing.calories,
        protein_per_serving: perServing.protein,
        carbs_per_serving: perServing.carbs,
        fat_per_serving: perServing.fat,
        category: data.tags || null,
        image_url: null,
        is_system: isSuperAdmin && isSystemContent,
      };

      const ingredientsData = ingredients.map((ing) => ({
        food_id: ing.food.id,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
      }));

      if (editingRecipe) {
        await updateMutation.mutateAsync({
          id: editingRecipe.id,
          recipe: recipeData,
          ingredients: ingredientsData,
        });
        toast.success("Recipe updated");
      } else {
        await createMutation.mutateAsync({
          recipe: recipeData,
          ingredients: ingredientsData,
        });
        toast.success("Recipe created");
      }

      onOpenChange(false);
      form.reset();
      setIngredients([]);
    } catch {
      toast.error("Failed to save recipe");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRecipe ? "Edit Recipe" : "Create Recipe"}</DialogTitle>
          <DialogDescription>
            Build a recipe by adding ingredients. Nutrition is calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grilled Chicken Salad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servings</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="prep_time_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cook_time_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cook Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., healthy, quick" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ingredients Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">Ingredients</h3>

              <div className="flex gap-2">
                <div className="flex-1">
                  <FoodSearchCombobox
                    value={selectedFood}
                    onSelect={setSelectedFood}
                    placeholder="Search to add ingredient..."
                  />
                </div>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  className="w-20"
                  min={1}
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addIngredient} disabled={!selectedFood} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {ingredients.length > 0 && (
                <div className="space-y-2">
                  {ingredients.map((item) => {
                    const nutrition = calculateNutrition(item.food, item.quantity, item.unit);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.food.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {nutrition.calories} kcal • P:{nutrition.protein}g • C:{nutrition.carbs}g • F:{nutrition.fat}g
                          </div>
                        </div>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateIngredient(item.id, { quantity: Number(e.target.value) || 0 })}
                          className="w-16 h-8"
                          min={1}
                        />
                        <Select
                          value={item.unit}
                          onValueChange={(u) => updateIngredient(item.id, { unit: u })}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeIngredient(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {ingredients.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No ingredients added. Search and add foods above.
                </div>
              )}
            </div>

            {/* Nutrition Summary */}
            {ingredients.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Total (whole recipe)</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                          <Flame className="h-4 w-4 text-orange-500 mb-1" />
                          <span className="font-medium text-sm">{totals.calories}</span>
                          <span className="text-xs text-muted-foreground">kcal</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                          <Beef className="h-4 w-4 text-red-500 mb-1" />
                          <span className="font-medium text-sm">{totals.protein}g</span>
                          <span className="text-xs text-muted-foreground">protein</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                          <Wheat className="h-4 w-4 text-amber-500 mb-1" />
                          <span className="font-medium text-sm">{totals.carbs}g</span>
                          <span className="text-xs text-muted-foreground">carbs</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                          <Droplet className="h-4 w-4 text-yellow-500 mb-1" />
                          <span className="font-medium text-sm">{totals.fat}g</span>
                          <span className="text-xs text-muted-foreground">fat</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Per Serving ({servings})
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center p-2 bg-primary/10 rounded-lg">
                          <Flame className="h-4 w-4 text-orange-500 mb-1" />
                          <span className="font-medium text-sm">{perServing.calories}</span>
                          <span className="text-xs text-muted-foreground">kcal</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-primary/10 rounded-lg">
                          <Beef className="h-4 w-4 text-red-500 mb-1" />
                          <span className="font-medium text-sm">{perServing.protein}g</span>
                          <span className="text-xs text-muted-foreground">protein</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-primary/10 rounded-lg">
                          <Wheat className="h-4 w-4 text-amber-500 mb-1" />
                          <span className="font-medium text-sm">{perServing.carbs}g</span>
                          <span className="text-xs text-muted-foreground">carbs</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-primary/10 rounded-lg">
                          <Droplet className="h-4 w-4 text-yellow-500 mb-1" />
                          <span className="font-medium text-sm">{perServing.fat}g</span>
                          <span className="text-xs text-muted-foreground">fat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Step-by-step cooking instructions..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingRecipe ? "Update Recipe" : "Create Recipe"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
