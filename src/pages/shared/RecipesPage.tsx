import { useState } from "react";
import { Plus, Search, ChefHat, Flame, Beef, Wheat, Droplet, Edit, Trash2, Clock, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecipes, useDeleteRecipe, Recipe } from "@/hooks/useRecipes";
import { RecipeBuilderDialog } from "@/components/diet/RecipeBuilderDialog";
import { RecipeDetailSheet } from "@/components/diet/RecipeDetailSheet";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecipesPageProps {
  viewOnly?: boolean;
}

export default function RecipesPage({ viewOnly = false }: RecipesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);

  const { data: recipes = [], isLoading } = useRecipes(searchQuery);
  const deleteMutation = useDeleteRecipe();

  const myRecipes = recipes.filter((r) => !r.is_system);
  const systemRecipes = recipes.filter((r) => r.is_system);

  const handleDelete = async () => {
    if (!deletingRecipe) return;
    try {
      await deleteMutation.mutateAsync(deletingRecipe.id);
      toast.success("Recipe deleted");
      setDeletingRecipe(null);
    } catch {
      toast.error("Failed to delete recipe");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Recipes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {viewOnly ? "Browse recipes with calculated nutrition" : "Create and manage recipes with auto-calculated nutrition"}
          </p>
        </div>
        {!viewOnly && (
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Recipe
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {!viewOnly && myRecipes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">My Recipes</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={() => setSelectedRecipe(recipe)}
                    onEdit={() => setEditingRecipe(recipe)}
                    onDelete={() => setDeletingRecipe(recipe)}
                  />
                ))}
              </div>
            </div>
          )}

          {systemRecipes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{viewOnly ? "Available Recipes" : "System Recipes"}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={() => setSelectedRecipe(recipe)}
                    isSystem
                  />
                ))}
              </div>
            </div>
          )}

          {recipes.length === 0 && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No recipes found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : viewOnly ? "No recipes available yet" : "Create your first recipe to get started"}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!viewOnly && (
        <>
          <RecipeBuilderDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />

          <RecipeBuilderDialog
            open={!!editingRecipe}
            onOpenChange={(open) => !open && setEditingRecipe(null)}
            editingRecipe={editingRecipe}
          />
        </>
      )}

      <RecipeDetailSheet
        recipe={selectedRecipe}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
      />

      {!viewOnly && (
        <AlertDialog open={!!deletingRecipe} onOpenChange={(open) => !open && setDeletingRecipe(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingRecipe?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  onView,
  onEdit,
  onDelete,
  isSystem,
}: {
  recipe: Recipe;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSystem?: boolean;
}) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-base">{recipe.name}</CardTitle>
              {recipe.description && (
                <CardDescription className="line-clamp-2 text-xs">{recipe.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="recipe" itemId={recipe.id} size="sm" />
            {!isSystem && onEdit && onDelete && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {isSystem && (
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
              <Shield className="w-3 h-3 mr-1" />
              System
            </Badge>
          )}
          {recipe.category && (
            <Badge variant="secondary">{recipe.category}</Badge>
          )}
          {totalTime > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {totalTime} min
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
            <Flame className="h-4 w-4 text-orange-500 mb-1" />
            <span className="font-medium">{recipe.calories_per_serving || 0}</span>
            <span className="text-xs text-muted-foreground">kcal</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
            <Beef className="h-4 w-4 text-red-500 mb-1" />
            <span className="font-medium">{recipe.protein_per_serving || 0}g</span>
            <span className="text-xs text-muted-foreground">protein</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
            <Wheat className="h-4 w-4 text-amber-500 mb-1" />
            <span className="font-medium">{recipe.carbs_per_serving || 0}g</span>
            <span className="text-xs text-muted-foreground">carbs</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
            <Droplet className="h-4 w-4 text-yellow-500 mb-1" />
            <span className="font-medium">{recipe.fat_per_serving || 0}g</span>
            <span className="text-xs text-muted-foreground">fat</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
