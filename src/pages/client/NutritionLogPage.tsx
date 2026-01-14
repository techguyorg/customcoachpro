import { useState } from "react";
import { format, subDays, addDays } from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useNutritionLog,
  useAddNutritionLog,
  useDeleteNutritionLog,
  calculateDailyTotals,
  groupByMealType,
  MealType,
  NutritionLogEntry,
} from "@/hooks/useNutritionLog";
import { FoodSearchCombobox } from "@/components/diet/FoodSearchCombobox";
import { Food, calculateNutrition } from "@/hooks/useFoods";
import { useClientAssignments } from "@/hooks/usePlanAssignments";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: "breakfast", label: "Breakfast", icon: "🌅" },
  { value: "lunch", label: "Lunch", icon: "☀️" },
  { value: "dinner", label: "Dinner", icon: "🌙" },
  { value: "snack", label: "Snack", icon: "🍎" },
  { value: "other", label: "Other", icon: "🍽️" },
];

export default function NutritionLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [customFoodName, setCustomFoodName] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");
  const [notes, setNotes] = useState("");
  const [pendingItems, setPendingItems] = useState<Array<{
    food: Food | null;
    customName: string;
    quantity: number;
    unit: string;
    mealType: MealType;
  }>>([]);

  const { data: entries = [], isLoading } = useNutritionLog(selectedDate);
  const { data: assignments = [] } = useClientAssignments();
  const addMutation = useAddNutritionLog();
  const deleteMutation = useDeleteNutritionLog();

  // Get active diet plan assignment
  const activeDietPlan = assignments.find(
    (a) => a.plan_type === "diet" && a.status === "active" && a.diet_plan_id
  );

  const dailyTotals = calculateDailyTotals(entries);
  const groupedEntries = groupByMealType(entries);

  // Calculate targets from assigned plan or use defaults
  const targets = {
    calories: activeDietPlan?.diet_plan?.calories_target || 2000,
    protein: activeDietPlan?.diet_plan?.protein_grams || 150,
    carbs: activeDietPlan?.diet_plan?.carbs_grams || 200,
    fat: activeDietPlan?.diet_plan?.fat_grams || 65,
  };

  // Add item to pending list
  const handleAddToPending = () => {
    if (!selectedFood && !customFoodName.trim()) {
      toast.error("Please select a food or enter a custom name");
      return;
    }

    setPendingItems([...pendingItems, {
      food: selectedFood,
      customName: customFoodName.trim(),
      quantity,
      unit,
      mealType: selectedMealType,
    }]);

    // Reset for next item
    setSelectedFood(null);
    setCustomFoodName("");
    setQuantity(100);
    setUnit("g");
    toast.success("Added to list - keep adding or save all");
  };

  // Remove item from pending list
  const handleRemovePending = (index: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== index));
  };

  // Save all pending items
  const handleSaveAll = async () => {
    // Combine pending items with current item if filled
    const itemsToSave = [...pendingItems];
    if (selectedFood || customFoodName.trim()) {
      itemsToSave.push({
        food: selectedFood,
        customName: customFoodName.trim(),
        quantity,
        unit,
        mealType: selectedMealType,
      });
    }

    if (itemsToSave.length === 0) {
      toast.error("Please add at least one food item");
      return;
    }

    try {
      for (const item of itemsToSave) {
        let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (item.food) {
          nutrition = calculateNutrition(item.food, item.quantity, item.unit);
        }

        await addMutation.mutateAsync({
          log_date: format(selectedDate, "yyyy-MM-dd"),
          meal_type: item.mealType,
          food_id: item.food?.id || null,
          recipe_id: null,
          custom_food_name: item.food ? null : item.customName,
          quantity: item.quantity,
          unit: item.unit,
          calories: nutrition.calories || null,
          protein_grams: nutrition.protein || null,
          carbs_grams: nutrition.carbs || null,
          fat_grams: nutrition.fat || null,
          notes: null,
        });
      }
      toast.success(`Logged ${itemsToSave.length} food item${itemsToSave.length > 1 ? 's' : ''}`);
      setShowAddDialog(false);
      resetForm();
    } catch {
      toast.error("Failed to log some items");
    }
  };

  // Legacy single item handler
  const handleAddEntry = async () => {
    if (!selectedFood && !customFoodName.trim()) {
      toast.error("Please select a food or enter a custom name");
      return;
    }

    let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (selectedFood) {
      const calc = calculateNutrition(selectedFood, quantity, unit);
      nutrition = calc;
    }

    try {
      await addMutation.mutateAsync({
        log_date: format(selectedDate, "yyyy-MM-dd"),
        meal_type: selectedMealType,
        food_id: selectedFood?.id || null,
        recipe_id: null,
        custom_food_name: selectedFood ? null : customFoodName.trim(),
        quantity,
        unit,
        calories: nutrition.calories || null,
        protein_grams: nutrition.protein || null,
        carbs_grams: nutrition.carbs || null,
        fat_grams: nutrition.fat || null,
        notes: notes.trim() || null,
      });
      toast.success("Food logged successfully");
      setShowAddDialog(false);
      resetForm();
    } catch {
      toast.error("Failed to log food");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const resetForm = () => {
    setSelectedFood(null);
    setCustomFoodName("");
    setQuantity(100);
    setUnit("g");
    setNotes("");
    setPendingItems([]);
  };

  const getProgressColor = (current: number, target: number) => {
    const pct = (current / target) * 100;
    if (pct < 80) return "bg-primary";
    if (pct <= 100) return "bg-green-500";
    return "bg-orange-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Nutrition Log</h1>
          <p className="text-sm text-muted-foreground">Track your daily food intake</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Food
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(selectedDate, "EEEE, MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={selectedDate >= new Date()}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Daily Summary
            {activeDietPlan && (
              <Badge variant="outline" className="ml-2">
                Plan: {activeDietPlan.diet_plan?.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Calories</span>
                </div>
                <span className="font-medium">
                  {Math.round(dailyTotals.calories)} / {targets.calories}
                </span>
              </div>
              <Progress
                value={Math.min((dailyTotals.calories / targets.calories) * 100, 100)}
                className={cn("h-2", getProgressColor(dailyTotals.calories, targets.calories))}
              />
            </div>

            {/* Protein */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span>Protein</span>
                </div>
                <span className="font-medium">
                  {Math.round(dailyTotals.protein)}g / {targets.protein}g
                </span>
              </div>
              <Progress
                value={Math.min((dailyTotals.protein / targets.protein) * 100, 100)}
                className={cn("h-2", getProgressColor(dailyTotals.protein, targets.protein))}
              />
            </div>

            {/* Carbs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Wheat className="h-4 w-4 text-amber-500" />
                  <span>Carbs</span>
                </div>
                <span className="font-medium">
                  {Math.round(dailyTotals.carbs)}g / {targets.carbs}g
                </span>
              </div>
              <Progress
                value={Math.min((dailyTotals.carbs / targets.carbs) * 100, 100)}
                className={cn("h-2", getProgressColor(dailyTotals.carbs, targets.carbs))}
              />
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Droplet className="h-4 w-4 text-yellow-500" />
                  <span>Fat</span>
                </div>
                <span className="font-medium">
                  {Math.round(dailyTotals.fat)}g / {targets.fat}g
                </span>
              </div>
              <Progress
                value={Math.min((dailyTotals.fat / targets.fat) * 100, 100)}
                className={cn("h-2", getProgressColor(dailyTotals.fat, targets.fat))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals by Type */}
      <div className="grid gap-4">
        {MEAL_TYPES.map(({ value, label, icon }) => {
          const mealEntries = groupedEntries[value];
          const mealTotals = calculateDailyTotals(mealEntries);

          return (
            <Card key={value}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{icon}</span>
                    {label}
                    {mealEntries.length > 0 && (
                      <Badge variant="secondary">{mealEntries.length} items</Badge>
                    )}
                  </CardTitle>
                  {mealEntries.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {Math.round(mealTotals.calories)} kcal
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {mealEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No foods logged for {label.toLowerCase()}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mealEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {entry.food?.name || entry.recipe?.name || entry.custom_food_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.quantity} {entry.unit} • {Math.round(entry.calories || 0)} kcal
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            P:{Math.round(entry.protein_grams || 0)}g C:
                            {Math.round(entry.carbs_grams || 0)}g F:
                            {Math.round(entry.fat_grams || 0)}g
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Food Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowAddDialog(open);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Food</DialogTitle>
            <DialogDescription>Add one or multiple foods to your nutrition log</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Pending Items List */}
            {pendingItems.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Items to log ({pendingItems.length})</span>
                  <Badge variant="secondary">
                    {pendingItems.reduce((sum, item) => {
                      if (item.food) {
                        return sum + calculateNutrition(item.food, item.quantity, item.unit).calories;
                      }
                      return sum;
                    }, 0).toFixed(0)} kcal total
                  </Badge>
                </Label>
                <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                  {pendingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">
                          {item.food?.name || item.customName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {MEAL_TYPES.find(m => m.value === item.mealType)?.icon} {item.quantity}{item.unit}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive flex-shrink-0"
                        onClick={() => handleRemovePending(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Meal</Label>
              <Select
                value={selectedMealType}
                onValueChange={(v) => setSelectedMealType(v as MealType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map(({ value, label, icon }) => (
                    <SelectItem key={value} value={value}>
                      {icon} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Food</Label>
              <FoodSearchCombobox
                value={selectedFood}
                onSelect={(food) => {
                  setSelectedFood(food);
                  if (food) setCustomFoodName("");
                }}
                placeholder="Search foods..."
              />
            </div>

            <div className="text-center text-sm text-muted-foreground">or</div>

            <div className="space-y-2">
              <Label>Custom Food Name</Label>
              <Input
                value={customFoodName}
                onChange={(e) => {
                  setCustomFoodName(e.target.value);
                  if (e.target.value) setSelectedFood(null);
                }}
                placeholder="Enter custom food name..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">grams</SelectItem>
                    <SelectItem value="oz">ounces</SelectItem>
                    <SelectItem value="serving">serving</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                    <SelectItem value="cup">cup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedFood && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium mb-2">Nutrition (estimated)</div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold">
                        {Math.round(calculateNutrition(selectedFood, quantity, unit).calories)}
                      </div>
                      <div className="text-muted-foreground">kcal</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">
                        {Math.round(calculateNutrition(selectedFood, quantity, unit).protein)}g
                      </div>
                      <div className="text-muted-foreground">protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">
                        {Math.round(calculateNutrition(selectedFood, quantity, unit).carbs)}g
                      </div>
                      <div className="text-muted-foreground">carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">
                        {Math.round(calculateNutrition(selectedFood, quantity, unit).fat)}g
                      </div>
                      <div className="text-muted-foreground">fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                onClick={handleAddToPending}
                disabled={!selectedFood && !customFoodName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={addMutation.isPending || (pendingItems.length === 0 && !selectedFood && !customFoodName.trim())}
                >
                  {addMutation.isPending ? "Saving..." : `Save${pendingItems.length > 0 ? ` (${pendingItems.length + (selectedFood || customFoodName ? 1 : 0)})` : ""}`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
