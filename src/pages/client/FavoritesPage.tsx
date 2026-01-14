import { useState } from "react";
import { Heart, Utensils, ChefHat, Dumbbell, ClipboardList, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFavorites, FavoriteItemType } from "@/hooks/useFavorites";
import { useDietPlans, DietPlan } from "@/hooks/useDietPlans";
import { useRecipes, Recipe } from "@/hooks/useRecipes";
import { useWorkoutTemplates, TemplateWithStats } from "@/hooks/useWorkoutTemplates";
import { useExercises } from "@/hooks/useExercises";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { DietPlanDetailSheet } from "@/components/diet/DietPlanDetailSheet";
import { RecipeDetailSheet } from "@/components/diet/RecipeDetailSheet";
import { TemplateDetailSheet } from "@/components/templates/TemplateDetailSheet";
import { ExerciseDetailSheet } from "@/components/exercises/ExerciseDetailSheet";
import type { Exercise } from "@/lib/api";

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<FavoriteItemType>("diet_plan");
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Fetch all favorites
  const { data: dietPlanFavorites = [], isLoading: dietPlanLoading } = useFavorites("diet_plan");
  const { data: recipeFavorites = [], isLoading: recipeLoading } = useFavorites("recipe");
  const { data: workoutFavorites = [], isLoading: workoutLoading } = useFavorites("workout_template");
  const { data: exerciseFavorites = [], isLoading: exerciseLoading } = useFavorites("exercise");

  // Fetch the actual items
  const { data: allDietPlans = [] } = useDietPlans();
  const { data: allRecipes = [] } = useRecipes();
  const { data: allTemplates = [] } = useWorkoutTemplates({ search: "", templateType: "all", difficulty: "all", daysPerWeek: "all" });
  const { data: allExercises = [] } = useExercises({ search: "", muscleGroup: "all", equipment: "all", difficulty: "all" });

  // Filter to only favorited items
  const favoritedDietPlans = allDietPlans.filter(p => 
    dietPlanFavorites.some(f => f.item_id === p.id)
  );
  const favoritedRecipes = allRecipes.filter(r => 
    recipeFavorites.some(f => f.item_id === r.id)
  );
  const favoritedTemplates = allTemplates.filter(t => 
    workoutFavorites.some(f => f.item_id === t.id)
  );
  const favoritedExercises = allExercises.filter(e => 
    exerciseFavorites.some(f => f.item_id === e.id)
  );

  const counts = {
    diet_plan: favoritedDietPlans.length,
    recipe: favoritedRecipes.length,
    workout_template: favoritedTemplates.length,
    exercise: favoritedExercises.length,
  };

  const totalFavorites = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          My Favorites
        </h1>
        <p className="text-muted-foreground">
          Quick access to your saved diet plans, recipes, workouts, and exercises
        </p>
      </div>

      {totalFavorites === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No favorites yet</h3>
            <p className="text-muted-foreground mt-1 max-w-md">
              Browse diet plans, recipes, workout programs, and exercises, then click the heart icon to add them to your favorites for quick access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FavoriteItemType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diet_plan" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Diet Plans</span>
              {counts.diet_plan > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.diet_plan}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recipe" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">Recipes</span>
              {counts.recipe > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.recipe}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="workout_template" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Workouts</span>
              {counts.workout_template > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.workout_template}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exercise" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Exercises</span>
              {counts.exercise > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.exercise}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diet_plan" className="mt-6">
            {dietPlanLoading ? (
              <LoadingState />
            ) : favoritedDietPlans.length === 0 ? (
              <EmptyState icon={Utensils} message="No favorited diet plans" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoritedDietPlans.map((plan) => (
                  <FavoriteDietPlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => setSelectedDietPlan(plan)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipe" className="mt-6">
            {recipeLoading ? (
              <LoadingState />
            ) : favoritedRecipes.length === 0 ? (
              <EmptyState icon={ChefHat} message="No favorited recipes" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoritedRecipes.map((recipe) => (
                  <FavoriteRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workout_template" className="mt-6">
            {workoutLoading ? (
              <LoadingState />
            ) : favoritedTemplates.length === 0 ? (
              <EmptyState icon={ClipboardList} message="No favorited workout programs" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoritedTemplates.map((template) => (
                  <FavoriteTemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exercise" className="mt-6">
            {exerciseLoading ? (
              <LoadingState />
            ) : favoritedExercises.length === 0 ? (
              <EmptyState icon={Dumbbell} message="No favorited exercises" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoritedExercises.map((exercise) => (
                  <FavoriteExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => setSelectedExerciseId(exercise.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <DietPlanDetailSheet
        plan={selectedDietPlan}
        onOpenChange={(open) => !open && setSelectedDietPlan(null)}
      />
      
      <RecipeDetailSheet
        recipe={selectedRecipe}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
      />

      <TemplateDetailSheet
        templateId={selectedTemplateId}
        open={!!selectedTemplateId}
        onOpenChange={(open) => !open && setSelectedTemplateId(null)}
      />

      <ExerciseDetailSheet
        exerciseId={selectedExerciseId}
        open={!!selectedExerciseId}
        onOpenChange={(open) => !open && setSelectedExerciseId(null)}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <Card className="py-8">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <Icon className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function FavoriteDietPlanCard({ plan, onClick }: { plan: DietPlan; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            {plan.description && (
              <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="diet_plan" itemId={plan.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {plan.goal && <Badge variant="secondary">{plan.goal}</Badge>}
          {plan.calories_target && <Badge variant="outline">{plan.calories_target} kcal</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteRecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{recipe.name}</CardTitle>
            {recipe.description && (
              <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="recipe" itemId={recipe.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
          {recipe.calories_per_serving && (
            <Badge variant="outline">{recipe.calories_per_serving} kcal</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteTemplateCard({ template, onClick }: { template: TemplateWithStats; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="workout_template" itemId={template.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{template.days_per_week} days/week</Badge>
          <Badge variant="outline">{template.difficulty}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteExerciseCard({ exercise, onClick }: { exercise: Exercise; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{exercise.name}</CardTitle>
            {exercise.description && (
              <CardDescription className="line-clamp-2">{exercise.description}</CardDescription>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="exercise" itemId={exercise.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{exercise.primary_muscle.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">{exercise.equipment.replace(/_/g, " ")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
