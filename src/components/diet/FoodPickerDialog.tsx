import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFoods, calculateNutrition, Food } from "@/hooks/useFoods";
import { CustomFoodDialog } from "./CustomFoodDialog";
import { Search, Apple, Plus, Flame, Beef, Wheat, Droplet } from "lucide-react";

interface FoodPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodAdded: (food: Food, quantity: number, unit: string, nutrition: { calories: number; protein: number; carbs: number; fat: number }) => void;
  mealName?: string;
}

export function FoodPickerDialog({ open, onOpenChange, onFoodAdded, mealName }: FoodPickerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");

  const { data: searchedFoods } = useFoods(searchQuery);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setUnit(food.default_serving_unit || "g");
    setQuantity(food.default_serving_size || 100);
  };

  const handleAddFood = () => {
    if (!selectedFood) return;
    const nutrition = calculateNutrition(selectedFood, quantity, unit);
    onFoodAdded(selectedFood, quantity, unit, nutrition);
    handleClose();
  };

  const handleCustomFoodCreated = (food: Food) => {
    const nutrition = calculateNutrition(food, food.default_serving_size || 100, food.default_serving_unit || "g");
    onFoodAdded(food, food.default_serving_size || 100, food.default_serving_unit || "g", nutrition);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedFood(null);
    setQuantity(100);
    setUnit("g");
    onOpenChange(false);
  };

  const currentNutrition = selectedFood ? calculateNutrition(selectedFood, quantity, unit) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5" />
            Add Food {mealName && <span className="text-muted-foreground">to {mealName}</span>}
          </DialogTitle>
          <DialogDescription>
            Search for foods or add a custom food to your meal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search foods (e.g., chicken, rice, apple)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {!selectedFood ? (
            <>
              {/* Food List */}
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {searchedFoods?.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      onClick={() => handleSelectFood(food)}
                    >
                      <Apple className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.calories_per_100g} kcal • P: {food.protein_per_100g}g • C: {food.carbs_per_100g}g • F: {food.fat_per_100g}g per 100g
                        </p>
                      </div>
                      {food.category && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {food.category}
                        </Badge>
                      )}
                    </button>
                  ))}

                  {/* Empty states */}
                  {(!searchedFoods || searchedFoods.length === 0) && searchQuery.length >= 2 && (
                    <div className="text-center py-8">
                      <Apple className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No foods found for "{searchQuery}"
                      </p>
                      <CustomFoodDialog
                        onFoodCreated={handleCustomFoodCreated}
                        trigger={
                          <Button variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add "{searchQuery}" as custom food
                          </Button>
                        }
                      />
                    </div>
                  )}

                  {searchQuery.length < 2 && (
                    <div className="text-center py-8">
                      <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Type at least 2 characters to search
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Or add a food not in our database
                      </p>
                      <CustomFoodDialog
                        onFoodCreated={handleCustomFoodCreated}
                        trigger={
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            <Plus className="w-4 h-4" />
                            Add custom food
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Selected Food Details */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{selectedFood.name}</p>
                    {selectedFood.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {selectedFood.category}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFood(null)}
                  >
                    Change
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedFood.calories_per_100g} kcal • P: {selectedFood.protein_per_100g}g • C: {selectedFood.carbs_per_100g}g • F: {selectedFood.fat_per_100g}g per 100g
                </p>
              </div>

              {/* Quantity & Unit */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Quantity</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={1}
                  />
                </div>
                <div className="w-36">
                  <label className="text-sm font-medium mb-1.5 block">Unit</label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">grams</SelectItem>
                      <SelectItem value="oz">ounces</SelectItem>
                      <SelectItem value="piece">piece</SelectItem>
                      <SelectItem value="serving">serving</SelectItem>
                      <SelectItem value="cup">cup</SelectItem>
                      <SelectItem value="tbsp">tablespoon</SelectItem>
                      <SelectItem value="tsp">teaspoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Calculated Nutrition */}
              {currentNutrition && quantity > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium mb-2">Nutrition for {quantity} {unit}</p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{currentNutrition.calories}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div>
                      <Beef className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{currentNutrition.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div>
                      <Wheat className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{currentNutrition.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div>
                      <Droplet className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{currentNutrition.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleAddFood} disabled={!quantity}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Meal
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
