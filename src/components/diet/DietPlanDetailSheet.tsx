import { Flame, Beef, Wheat, Droplet, Clock, Utensils, Play, Loader2, Apple, Shield } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDietPlanWithMeals, DietPlan } from "@/hooks/useDietPlans";
import { useStartDietPlan } from "@/hooks/useStartProgram";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";
import { DietPlanPdf } from "@/components/pdf/DietPlanPdf";
import { ensureArray } from "@/lib/utils";

const goalLabels: Record<string, string> = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  maintenance: "Maintenance",
  performance: "Performance",
  general_health: "General Health",
};

const dietaryLabels: Record<string, string> = {
  standard: "Standard",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  keto: "Keto",
  paleo: "Paleo",
  mediterranean: "Mediterranean",
  low_carb: "Low Carb",
  high_protein: "High Protein",
};

interface MealFoodItem {
  id: string;
  meal_id: string;
  food_id: string | null;
  recipe_id: string | null;
  quantity: number;
  unit: string;
  order_index: number;
  notes: string | null;
  calculated_calories: number | null;
  calculated_protein: number | null;
  calculated_carbs: number | null;
  calculated_fat: number | null;
  food?: {
    id: string;
    name: string;
    calories_per_100g: number | null;
  } | null;
  recipe?: {
    id: string;
    name: string;
    calories_per_serving: number | null;
  } | null;
}

interface Props {
  plan: DietPlan | null;
  onOpenChange: (open: boolean) => void;
  open?: boolean;
}

export function DietPlanDetailSheet({ plan, onOpenChange, open }: Props) {
  const { data: planWithMeals } = useDietPlanWithMeals(plan?.id);
  const displayPlan = planWithMeals || plan;
  const startDietPlan = useStartDietPlan();

  // Fetch food items for all meals
  const mealIds = displayPlan?.meals?.map(m => m.id) || [];
  const { data: mealFoodItems = [] } = useQuery({
    queryKey: ["meal-food-items", mealIds],
    queryFn: async () => {
      if (mealIds.length === 0) return [];
      
      return api.get<MealFoodItem[]>(`/api/diet/meal-food-items?mealIds=${mealIds.join(',')}`);
    },
    enabled: mealIds.length > 0,
  });

  // Group food items by meal_id
  const foodItemsByMeal = mealFoodItems.reduce<Record<string, MealFoodItem[]>>((acc, item) => {
    if (!acc[item.meal_id]) acc[item.meal_id] = [];
    acc[item.meal_id].push(item);
    return acc;
  }, {});

  const handleFollowPlan = () => {
    if (!plan?.id) return;
    startDietPlan.mutate({ dietPlanId: plan.id });
  };

  // Support both controlled (open prop) and uncontrolled (!!plan) modes
  const isOpen = open !== undefined ? open : !!plan;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {displayPlan && (
          <>
            <SheetHeader>
              <SheetTitle className="text-2xl">{displayPlan.name}</SheetTitle>
              <SheetDescription>{displayPlan.description}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleFollowPlan}
                  disabled={startDietPlan.isPending}
                >
                  {startDietPlan.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Follow This Plan
                </Button>
                <ExportPdfButton
                  document={
                    <DietPlanPdf
                      data={{
                        name: displayPlan.name,
                        description: displayPlan.description || undefined,
                        goal: displayPlan.goal || undefined,
                        dietaryType: displayPlan.dietary_type || undefined,
                        caloriesTarget: displayPlan.calories_target || undefined,
                        proteinGrams: displayPlan.protein_grams || undefined,
                        carbsGrams: displayPlan.carbs_grams || undefined,
                        fatGrams: displayPlan.fat_grams || undefined,
                        mealsPerDay: displayPlan.meals_per_day || undefined,
                        meals: displayPlan.meals?.map(m => ({
                          name: m.meal_name,
                          time: m.time_suggestion || undefined,
                          calories: m.calories || undefined,
                          protein: m.protein_grams || undefined,
                          carbs: m.carbs_grams || undefined,
                          fat: m.fat_grams || undefined,
                          foods: (foodItemsByMeal[m.id] || []).map(f => ({
                            name: f.food?.name || f.recipe?.name || "Unknown",
                            quantity: f.quantity,
                            unit: f.unit,
                            calories: f.calculated_calories || undefined,
                          })),
                          notes: m.notes || undefined,
                        })) || [],
                        notes: displayPlan.notes || undefined,
                      }}
                    />
                  }
                  filename={`${displayPlan.name.replace(/\s+/g, "-").toLowerCase()}-diet-plan.pdf`}
                  variant="outline"
                  label="Export"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {displayPlan.is_system && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Shield className="w-3 h-3 mr-1" />
                    System Plan
                  </Badge>
                )}
                {displayPlan.goal && (
                  <Badge variant="secondary">{goalLabels[displayPlan.goal] || displayPlan.goal}</Badge>
                )}
                {displayPlan.dietary_type && (
                  <Badge variant="outline">{dietaryLabels[displayPlan.dietary_type] || displayPlan.dietary_type}</Badge>
                )}
              </div>

              {displayPlan.calories_target && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Daily Macros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Flame className="h-5 w-5 text-orange-500 mb-2" />
                        <span className="text-xl font-bold">{displayPlan.calories_target}</span>
                        <span className="text-xs text-muted-foreground">kcal</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Beef className="h-5 w-5 text-red-500 mb-2" />
                        <span className="text-xl font-bold">{displayPlan.protein_grams || 0}g</span>
                        <span className="text-xs text-muted-foreground">protein</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Wheat className="h-5 w-5 text-amber-500 mb-2" />
                        <span className="text-xl font-bold">{displayPlan.carbs_grams || 0}g</span>
                        <span className="text-xs text-muted-foreground">carbs</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Droplet className="h-5 w-5 text-yellow-500 mb-2" />
                        <span className="text-xl font-bold">{displayPlan.fat_grams || 0}g</span>
                        <span className="text-xs text-muted-foreground">fat</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Meal Structure ({displayPlan.meals_per_day} meals/day)
                </h3>

                <div className="space-y-3">
                  {displayPlan.meals && displayPlan.meals.length > 0 ? (
                    displayPlan.meals.map((meal) => {
                      const mealFoods = foodItemsByMeal[meal.id] || [];
                      
                      return (
                        <Card key={meal.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{meal.meal_name}</h4>
                                {meal.time_suggestion && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {meal.time_suggestion}
                                  </p>
                                )}
                              </div>
                              {meal.calories && (
                                <Badge variant="outline">{meal.calories} kcal</Badge>
                              )}
                            </div>

                            {(meal.protein_grams || meal.carbs_grams || meal.fat_grams) && (
                              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                                {meal.protein_grams && <span>P: {meal.protein_grams}g</span>}
                                {meal.carbs_grams && <span>C: {meal.carbs_grams}g</span>}
                                {meal.fat_grams && <span>F: {meal.fat_grams}g</span>}
                              </div>
                            )}

                            {/* Food Items in this meal */}
                            {mealFoods.length > 0 && (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                  <Apple className="h-3 w-3" />
                                  Food Items
                                </p>
                                {mealFoods.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-2 py-1.5"
                                  >
                                    <span className="font-medium">
                                      {item.food?.name || item.recipe?.name || "Unknown"}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {item.quantity} {item.unit}
                                      {item.calculated_calories && ` • ${item.calculated_calories} kcal`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Food suggestions (text-based) */}
                            {ensureArray(meal.food_suggestions).length > 0 && mealFoods.length === 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground font-medium mb-2">Suggested Foods</p>
                                <div className="flex flex-wrap gap-1">
                                  {ensureArray(meal.food_suggestions).map((suggestion, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {suggestion}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {meal.notes && (
                              <p className="text-sm mt-2 text-muted-foreground">{meal.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-sm">No meal details added yet</p>
                  )}
                </div>
              </div>

              {displayPlan.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{displayPlan.notes}</p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
