import { Flame, Beef, Wheat, Droplet, Clock, Users, Shield } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRecipeWithIngredients, Recipe } from "@/hooks/useRecipes";
import { calculateNutrition } from "@/hooks/useFoods";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  recipe: Recipe | null;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailSheet({ recipe, onOpenChange }: Props) {
  const { data: fullRecipe, isLoading } = useRecipeWithIngredients(recipe?.id);

  return (
    <Sheet open={!!recipe} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{recipe?.name}</SheetTitle>
          {recipe?.description && (
            <SheetDescription>{recipe.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            {recipe?.is_system && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Shield className="w-3 h-3 mr-1" />
                System Recipe
              </Badge>
            )}
            {recipe?.category && (
              <Badge variant="secondary">{recipe.category}</Badge>
            )}
            {((recipe?.prep_time_minutes || 0) + (recipe?.cook_time_minutes || 0)) > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(recipe?.prep_time_minutes || 0) + (recipe?.cook_time_minutes || 0)} min total
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {recipe?.servings} serving{recipe?.servings !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Nutrition per serving */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nutrition per Serving</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Flame className="h-5 w-5 text-orange-500 mb-1" />
                  <span className="font-bold text-lg">{recipe?.calories_per_serving || 0}</span>
                  <span className="text-xs text-muted-foreground">kcal</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Beef className="h-5 w-5 text-red-500 mb-1" />
                  <span className="font-bold text-lg">{recipe?.protein_per_serving || 0}g</span>
                  <span className="text-xs text-muted-foreground">protein</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Wheat className="h-5 w-5 text-amber-500 mb-1" />
                  <span className="font-bold text-lg">{recipe?.carbs_per_serving || 0}g</span>
                  <span className="text-xs text-muted-foreground">carbs</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <Droplet className="h-5 w-5 text-yellow-500 mb-1" />
                  <span className="font-bold text-lg">{recipe?.fat_per_serving || 0}g</span>
                  <span className="text-xs text-muted-foreground">fat</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <div>
            <h3 className="font-semibold mb-3">Ingredients</h3>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : fullRecipe?.ingredients && fullRecipe.ingredients.length > 0 ? (
              <div className="space-y-2">
                {fullRecipe.ingredients.map((ing) => {
                  const nutrition = ing.food 
                    ? calculateNutrition(ing.food as any, ing.quantity, ing.unit)
                    : { calories: 0, protein: 0, carbs: 0, fat: 0 };
                  
                  return (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{ing.food?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {ing.quantity} {ing.unit}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {nutrition.calories} kcal
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No ingredients listed</p>
            )}
          </div>

          {/* Instructions */}
          {recipe?.instructions && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Instructions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {recipe.instructions}
                </p>
              </div>
            </>
          )}

          {/* Time breakdown */}
          {(recipe?.prep_time_minutes || recipe?.cook_time_minutes) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {recipe.prep_time_minutes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Prep Time</p>
                    <p className="font-medium">{recipe.prep_time_minutes} minutes</p>
                  </div>
                )}
                {recipe.cook_time_minutes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cook Time</p>
                    <p className="font-medium">{recipe.cook_time_minutes} minutes</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
