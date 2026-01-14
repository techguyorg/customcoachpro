import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddNutritionLog, type MealType } from "@/hooks/useNutritionLog";
import { useFoods, Food, calculateNutrition } from "@/hooks/useFoods";
import { toast } from "sonner";
import { Loader2, Search, Apple, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

interface QuickLogNutritionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: "breakfast", label: "Breakfast", icon: "🌅" },
  { value: "lunch", label: "Lunch", icon: "☀️" },
  { value: "dinner", label: "Dinner", icon: "🌙" },
  { value: "snack", label: "Snack", icon: "🍎" },
];

const UNITS = [
  { value: "g", label: "grams" },
  { value: "oz", label: "ounces" },
  { value: "serving", label: "serving" },
  { value: "piece", label: "piece" },
  { value: "cup", label: "cup" },
];

export function QuickLogNutritionDialog({ open, onOpenChange }: QuickLogNutritionDialogProps) {
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customCalories, setCustomCalories] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");

  // Pass search query to useFoods to fetch from database
  const { data: foods = [], isLoading: isSearching } = useFoods(searchQuery);
  const addNutritionLog = useAddNutritionLog();

  const handleSubmit = async () => {
    try {
      if (!selectedFood && !customFoodName) {
        toast.error("Please select a food or enter a custom name");
        return;
      }

      let calories = 0, protein = 0, carbs = 0, fat = 0;

      if (selectedFood) {
        const nutrition = calculateNutrition(selectedFood, quantity, unit);
        calories = nutrition.calories;
        protein = nutrition.protein;
        carbs = nutrition.carbs;
        fat = nutrition.fat;
      } else if (showCustomForm) {
        calories = Number(customCalories) || 0;
        protein = Number(customProtein) || 0;
        carbs = Number(customCarbs) || 0;
        fat = Number(customFat) || 0;
      }

      await addNutritionLog.mutateAsync({
        log_date: format(new Date(), "yyyy-MM-dd"),
        meal_type: mealType,
        food_id: selectedFood?.id || null,
        recipe_id: null,
        custom_food_name: selectedFood ? null : customFoodName,
        quantity,
        unit,
        calories,
        protein_grams: protein,
        carbs_grams: carbs,
        fat_grams: fat,
        notes: null,
      });

      toast.success("Food logged!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to log food");
    }
  };

  const resetForm = () => {
    setMealType("breakfast");
    setSearchQuery("");
    setSelectedFood(null);
    setShowCustomForm(false);
    setCustomFoodName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setQuantity(100);
    setUnit("g");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5" />
            Quick Log Food
          </DialogTitle>
          <DialogDescription>
            Log a food item without leaving the dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal Type */}
          <div className="space-y-2">
            <Label>Meal</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!showCustomForm ? (
            <>
              {/* Food Search */}
              <div className="space-y-2">
                <Label>Search Food</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Type at least 2 characters..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedFood(null);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && !selectedFood && (
                <ScrollArea className="h-40 border rounded-lg">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Searching...</span>
                    </div>
                  ) : foods.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {foods.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => {
                            setSelectedFood(food);
                            setSearchQuery(food.name);
                            if (food.default_serving_unit) {
                              setUnit(food.default_serving_unit);
                            }
                            if (food.default_serving_size) {
                              setQuantity(food.default_serving_size);
                            }
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm"
                        >
                          <span className="font-medium">{food.name}</span>
                          {food.brand && (
                            <span className="text-xs text-muted-foreground ml-1">({food.brand})</span>
                          )}
                          <span className="text-xs text-muted-foreground block">
                            {food.calories_per_100g} kcal/100g • P:{food.protein_per_100g}g C:{food.carbs_per_100g}g F:{food.fat_per_100g}g
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <p className="text-sm text-muted-foreground mb-2">No foods found</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowCustomForm(true);
                          setCustomFoodName(searchQuery);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Custom Food
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              )}

              {/* Add Custom Food Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={() => setShowCustomForm(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Custom Food
              </Button>
            </>
          ) : (
            <>
              {/* Custom Food Form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Food Name</Label>
                  <Input
                    placeholder="Enter food name"
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Calories</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Carbs (g)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fat (g)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={customFat}
                      onChange={(e) => setCustomFat(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomFoodName("");
                  }}
                >
                  ← Back to Search
                </Button>
              </div>
            </>
          )}

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
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
            </div>
          </div>

          {/* Selected Food Info */}
          {selectedFood && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="font-medium text-sm">{selectedFood.name}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{Math.round(calculateNutrition(selectedFood, quantity, unit).calories)} kcal</span>
                  <span>{Math.round(calculateNutrition(selectedFood, quantity, unit).protein)}g P</span>
                  <span>{Math.round(calculateNutrition(selectedFood, quantity, unit).carbs)}g C</span>
                  <span>{Math.round(calculateNutrition(selectedFood, quantity, unit).fat)}g F</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={addNutritionLog.isPending}>
              {addNutritionLog.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log Food
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
