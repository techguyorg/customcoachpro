import { useState } from "react";
import { Plus, Trash2, Beef, Wheat, Droplet, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FoodSearchCombobox } from "./FoodSearchCombobox";
import { FoodAlternativesPopover, FoodAlternative } from "./FoodAlternatives";
import { CustomFoodDialog } from "./CustomFoodDialog";
import { Food, calculateNutrition } from "@/hooks/useFoods";

export interface MealFoodItem {
  id: string;
  food: Food;
  quantity: number;
  unit: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface Props {
  mealName: string;
  items: MealFoodItem[];
  onItemsChange: (items: MealFoodItem[]) => void;
  timeSuggestion?: string;
  onTimeChange?: (time: string) => void;
  alternatives?: FoodAlternative[];
  onAlternativesChange?: (alternatives: FoodAlternative[]) => void;
  showAlternatives?: boolean;
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

export function MealFoodBuilder({ 
  mealName, 
  items, 
  onItemsChange, 
  timeSuggestion, 
  onTimeChange,
  alternatives = [],
  onAlternativesChange,
  showAlternatives = true,
}: Props) {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>("g");

  const addFood = (foodToAdd?: Food) => {
    const food = foodToAdd || selectedFood;
    if (!food) return;

    const nutrition = calculateNutrition(food, quantity, unit);
    const newItem: MealFoodItem = {
      id: crypto.randomUUID(),
      food: food,
      quantity,
      unit,
      nutrition,
    };

    onItemsChange([...items, newItem]);
    setSelectedFood(null);
    setQuantity(100);
    setUnit("g");
  };

  const handleCustomFoodCreated = (food: Food) => {
    addFood(food);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
    // Also remove alternatives for this food
    if (onAlternativesChange) {
      const itemToRemove = items.find((i) => i.id === id);
      if (itemToRemove) {
        onAlternativesChange(
          alternatives.filter((a) => a.originalFood.id !== itemToRemove.food.id)
        );
      }
    }
  };

  const updateItemQuantity = (id: string, newQuantity: number) => {
    onItemsChange(
      items.map((item) => {
        if (item.id === id) {
          const nutrition = calculateNutrition(item.food, newQuantity, item.unit);
          return { ...item, quantity: newQuantity, nutrition };
        }
        return item;
      })
    );
  };

  const updateItemUnit = (id: string, newUnit: string) => {
    onItemsChange(
      items.map((item) => {
        if (item.id === id) {
          const nutrition = calculateNutrition(item.food, item.quantity, newUnit);
          return { ...item, unit: newUnit, nutrition };
        }
        return item;
      })
    );
  };

  const handleAddAlternative = (food: Food, alternativeFood: Food) => {
    if (!onAlternativesChange) return;
    const newAlt: FoodAlternative = {
      id: crypto.randomUUID(),
      originalFood: food,
      alternativeFood,
    };
    onAlternativesChange([...alternatives, newAlt]);
  };

  const handleRemoveAlternative = (altId: string) => {
    if (!onAlternativesChange) return;
    onAlternativesChange(alternatives.filter((a) => a.id !== altId));
  };

  // Calculate meal totals
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.protein,
      carbs: acc.carbs + item.nutrition.carbs,
      fat: acc.fat + item.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{mealName}</CardTitle>
          {onTimeChange && (
            <Input
              type="time"
              value={timeSuggestion || ""}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-32 h-8"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Food Section */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <FoodSearchCombobox
                value={selectedFood}
                onSelect={setSelectedFood}
                placeholder="Search to add food..."
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
            <Button onClick={() => addFood()} disabled={!selectedFood} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {/* Custom Food Option */}
          <div className="flex justify-end">
            <CustomFoodDialog 
              onFoodCreated={handleCustomFoodCreated}
              trigger={
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <Plus className="h-3 w-3 mr-1" />
                  Can't find it? Add custom food
                </Button>
              }
            />
          </div>
        </div>

        {/* Food Items List */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.food.name}</span>
                    {showAlternatives && onAlternativesChange && (
                      <FoodAlternativesPopover
                        food={item.food}
                        alternatives={alternatives}
                        onAddAlternative={(alt) => handleAddAlternative(item.food, alt)}
                        onRemoveAlternative={handleRemoveAlternative}
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.nutrition.calories} kcal • P:{item.nutrition.protein}g • C:{item.nutrition.carbs}g • F:{item.nutrition.fat}g
                  </div>
                </div>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.id, Number(e.target.value) || 0)}
                  className="w-16 h-8"
                  min={1}
                />
                <Select value={item.unit} onValueChange={(u) => updateItemUnit(item.id, u)}>
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
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Meal Totals */}
        {items.length > 0 && (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{totals.calories}</span>
              <span className="text-muted-foreground">kcal</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Beef className="h-4 w-4 text-red-500" />
              <span className="font-medium">{totals.protein.toFixed(1)}</span>
              <span className="text-muted-foreground">g</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Wheat className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{totals.carbs.toFixed(1)}</span>
              <span className="text-muted-foreground">g</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Droplet className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{totals.fat.toFixed(1)}</span>
              <span className="text-muted-foreground">g</span>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No foods added yet. Search and add foods above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
