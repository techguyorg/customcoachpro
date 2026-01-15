import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Food } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Apple, Search, Trash2, Pencil, Plus, Loader2, Flame, Beef, Wheat, Droplet } from "lucide-react";
import { toast } from "sonner";
import { CustomFoodDialog } from "@/components/diet/CustomFoodDialog";
import { EditFoodDialog } from "@/components/diet/EditFoodDialog";

export function MyCustomFoodsCard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteFood, setDeleteFood] = useState<Food | null>(null);

  // Fetch custom foods created by the coach
  const { data: customFoods, isLoading } = useQuery({
    queryKey: ["my-custom-foods"],
    queryFn: async () => {
      return api.get<Food[]>("/api/foods/my-foods");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/foods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-custom-foods"] });
      queryClient.invalidateQueries({ queryKey: ["foods"] });
      toast.success("Food deleted successfully");
      setDeleteFood(null);
    },
    onError: () => {
      toast.error("Failed to delete food");
    },
  });

  const filteredFoods = customFoods?.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Apple className="w-5 h-5" />
              My Custom Foods
            </CardTitle>
            <CardDescription>
              Manage your personal food library for diet plans
            </CardDescription>
          </div>
          <CustomFoodDialog
            onFoodCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["my-custom-foods"] });
            }}
            trigger={
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add Food
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your custom foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Foods List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-8">
            <Apple className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No foods found matching "${searchQuery}"`
                : "You haven't created any custom foods yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Custom foods you create will appear here for easy management
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Apple className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{food.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {food.calories_per_100g} kcal
                      </span>
                      <span className="flex items-center gap-1">
                        <Beef className="w-3 h-3 text-red-500" />
                        {food.protein_per_100g}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Wheat className="w-3 h-3 text-amber-500" />
                        {food.carbs_per_100g}g
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-yellow-500" />
                        {food.fat_per_100g}g
                      </span>
                    </div>
                  </div>
                  {food.category && (
                    <Badge variant="secondary" className="text-xs">
                      {food.category}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingFood(food)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteFood(food)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Stats */}
        {filteredFoods.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {filteredFoods.length} custom food{filteredFoods.length !== 1 ? "s" : ""} in your library
          </p>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <EditFoodDialog
        open={!!editingFood}
        onOpenChange={(open) => {
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ["my-custom-foods"] });
            queryClient.invalidateQueries({ queryKey: ["foods"] });
            setEditingFood(null);
          }
        }}
        food={editingFood}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFood} onOpenChange={(open) => !open && setDeleteFood(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Food?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFood?.name}"? This action cannot be undone.
              The food will be removed from your library but will remain in any diet plans that already use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFood && deleteMutation.mutate(deleteFood.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
