import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Flame, Beef, Wheat, Droplet, ChevronLeft, ChevronRight, Check, Loader2, Clock, Search, Apple } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateDietPlan, useUpdateDietPlan, DietPlan } from "@/hooks/useDietPlans";
import { useFoods, calculateNutrition, Food } from "@/hooks/useFoods";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Basics", description: "Plan details" },
  { id: 2, title: "Targets", description: "Daily macros" },
  { id: 3, title: "Meals", description: "Meal structure" },
  { id: 4, title: "Review", description: "Confirm & create" },
];

const DEFAULT_MEALS = [
  { name: "Breakfast", time: "07:00" },
  { name: "Lunch", time: "12:00" },
  { name: "Snack", time: "15:00" },
  { name: "Dinner", time: "19:00" },
];

interface MealFood {
  food: Food;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealData {
  name: string;
  time: string;
  foods: MealFood[];
  notes: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  dietary_type: z.string().optional(),
  calories_target: z.number().optional(),
  protein_grams: z.number().optional(),
  carbs_grams: z.number().optional(),
  fat_grams: z.number().optional(),
  meals_per_day: z.number().min(1).max(8).default(4),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan?: DietPlan | null;
}

export function DietPlanWizard({ open, onOpenChange, editingPlan }: Props) {
  const [step, setStep] = useState(1);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [selectedMeal, setSelectedMeal] = useState(0);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [foodQuantity, setFoodQuantity] = useState(100);
  const [foodUnit, setFoodUnit] = useState("g");
  
  const createMutation = useCreateDietPlan();
  const updateMutation = useUpdateDietPlan();
  
  const { data: searchedFoods } = useFoods(foodSearch);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      dietary_type: "standard",
      calories_target: 2000,
      protein_grams: 150,
      carbs_grams: 200,
      fat_grams: 70,
      meals_per_day: 4,
      notes: "",
    },
  });

  const mealsPerDay = form.watch("meals_per_day");

  // Initialize meals when dialog opens or meals_per_day changes
  useEffect(() => {
    if (open && meals.length === 0) {
      const initialMeals = DEFAULT_MEALS.slice(0, mealsPerDay).map(m => ({
        ...m,
        foods: [],
        notes: "",
      }));
      setMeals(initialMeals);
    }
  }, [open, mealsPerDay]);

  // Update meals when meals_per_day changes
  useEffect(() => {
    if (meals.length > 0) {
      setMeals(prev => {
        if (mealsPerDay > prev.length) {
          const newMeals = [...prev];
          for (let i = prev.length; i < mealsPerDay; i++) {
            newMeals.push({
              name: `Meal ${i + 1}`,
              time: "",
              foods: [],
              notes: "",
            });
          }
          return newMeals;
        } else if (mealsPerDay < prev.length) {
          return prev.slice(0, mealsPerDay);
        }
        return prev;
      });
    }
  }, [mealsPerDay]);

  // Load editing plan data
  useEffect(() => {
    if (editingPlan && open) {
      form.reset({
        name: editingPlan.name,
        description: editingPlan.description || "",
        goal: editingPlan.goal || "",
        dietary_type: editingPlan.dietary_type || "standard",
        calories_target: editingPlan.calories_target || 2000,
        protein_grams: editingPlan.protein_grams || 150,
        carbs_grams: editingPlan.carbs_grams || 200,
        fat_grams: editingPlan.fat_grams || 70,
        meals_per_day: editingPlan.meals_per_day || 4,
        notes: editingPlan.notes || "",
      });
    }
  }, [editingPlan, open, form]);

  const resetWizard = () => {
    setStep(1);
    setMeals([]);
    setSelectedMeal(0);
    setShowFoodPicker(false);
    setFoodSearch("");
    setSelectedFood(null);
    form.reset();
    onOpenChange(false);
  };

  const handleNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(["name"]);
      if (!valid) return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addFoodToMeal = () => {
    if (!selectedFood) return;
    
    const nutrition = calculateNutrition(selectedFood, foodQuantity, foodUnit);
    
    setMeals(prev => {
      const newMeals = [...prev];
      newMeals[selectedMeal].foods.push({
        food: selectedFood,
        quantity: foodQuantity,
        unit: foodUnit,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
      });
      return newMeals;
    });
    
    setShowFoodPicker(false);
    setSelectedFood(null);
    setFoodSearch("");
    setFoodQuantity(100);
    setFoodUnit("g");
  };

  const removeFoodFromMeal = (mealIdx: number, foodIdx: number) => {
    setMeals(prev => {
      const newMeals = [...prev];
      newMeals[mealIdx].foods.splice(foodIdx, 1);
      return newMeals;
    });
  };

  const updateMealInfo = (mealIdx: number, updates: Partial<MealData>) => {
    setMeals(prev => {
      const newMeals = [...prev];
      newMeals[mealIdx] = { ...newMeals[mealIdx], ...updates };
      return newMeals;
    });
  };

  const calculateMealTotals = (meal: MealData) => {
    return meal.foods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const calculateDayTotals = () => {
    return meals.reduce(
      (acc, meal) => {
        const mealTotals = calculateMealTotals(meal);
        return {
          calories: acc.calories + mealTotals.calories,
          protein: acc.protein + mealTotals.protein,
          carbs: acc.carbs + mealTotals.carbs,
          fat: acc.fat + mealTotals.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleCreate = async () => {
    try {
      const data = form.getValues();
      const dayTotals = calculateDayTotals();
      
      const planData = {
        name: data.name,
        description: data.description || null,
        goal: data.goal || null,
        dietary_type: data.dietary_type || null,
        calories_target: dayTotals.calories || data.calories_target || null,
        protein_grams: Math.round(dayTotals.protein) || data.protein_grams || null,
        carbs_grams: Math.round(dayTotals.carbs) || data.carbs_grams || null,
        fat_grams: Math.round(dayTotals.fat) || data.fat_grams || null,
        meals_per_day: data.meals_per_day,
        notes: data.notes || null,
        is_system: false,
        is_active: true,
      };

      const mealsData = meals.map((meal, idx) => {
        const mealTotals = calculateMealTotals(meal);
        return {
          meal_number: idx + 1,
          meal_name: meal.name,
          time_suggestion: meal.time || null,
          calories: mealTotals.calories || null,
          protein_grams: Math.round(mealTotals.protein) || null,
          carbs_grams: Math.round(mealTotals.carbs) || null,
          fat_grams: Math.round(mealTotals.fat) || null,
          food_suggestions: meal.foods.map(f => f.food.name),
          notes: meal.notes || null,
        };
      });

      if (editingPlan) {
        await updateMutation.mutateAsync({
          id: editingPlan.id,
          plan: planData,
          meals: mealsData,
        });
        toast.success("Diet plan updated");
      } else {
        await createMutation.mutateAsync({ plan: planData, meals: mealsData });
        toast.success("Diet plan created");
      }
      resetWizard();
    } catch {
      toast.error("Failed to save diet plan");
    }
  };

  const dayTotals = calculateDayTotals();

  return (
    <Dialog open={open} onOpenChange={(o) => o ? onOpenChange(true) : resetWizard()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Diet Plan" : "Create Diet Plan"}</DialogTitle>
            <DialogDescription>
              Build a complete nutrition plan with meals and foods
            </DialogDescription>
          </DialogHeader>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-6" style={{ maxHeight: "calc(90vh - 220px)" }}>
          <Form {...form}>
            <form className="space-y-6 py-6">
              {/* Step 1: Basics */}
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., High Protein Muscle Gain" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the diet plan..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weight_loss">Weight Loss</SelectItem>
                              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="performance">Performance</SelectItem>
                              <SelectItem value="general_health">General Health</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietary_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dietary Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="keto">Keto</SelectItem>
                              <SelectItem value="paleo">Paleo</SelectItem>
                              <SelectItem value="mediterranean">Mediterranean</SelectItem>
                              <SelectItem value="low_carb">Low Carb</SelectItem>
                              <SelectItem value="high_protein">High Protein</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="meals_per_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meals Per Day</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[2, 3, 4, 5, 6].map((n) => (
                              <SelectItem key={n} value={n.toString()}>
                                {n} meals
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Targets */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Set your daily macro targets. These will be used as reference when building meals.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="calories_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            Calories
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2000"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="protein_grams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Beef className="w-4 h-4 text-red-500" />
                            Protein (g)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="150"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="carbs_grams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Wheat className="w-4 h-4 text-amber-500" />
                            Carbs (g)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="200"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fat_grams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Droplet className="w-4 h-4 text-yellow-500" />
                            Fat (g)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="70"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        💡 <strong>Tip:</strong> A typical breakdown is 40% carbs, 30% protein, 30% fat.
                        For muscle gain, increase protein. For weight loss, reduce calories by 300-500.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3: Meals */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Add foods to each meal. Current: {dayTotals.calories} kcal
                    </p>
                    <Badge variant={dayTotals.calories > 0 ? "default" : "secondary"}>
                      P: {Math.round(dayTotals.protein)}g • C: {Math.round(dayTotals.carbs)}g • F: {Math.round(dayTotals.fat)}g
                    </Badge>
                  </div>

                  {/* Meal Tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {meals.map((meal, idx) => {
                      const mealTotals = calculateMealTotals(meal);
                      return (
                        <Button
                          key={idx}
                          type="button"
                          variant={selectedMeal === idx ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMeal(idx)}
                        >
                          {meal.name}
                          {mealTotals.calories > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {mealTotals.calories} kcal
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Selected Meal */}
                  {meals[selectedMeal] && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Input
                            value={meals[selectedMeal].name}
                            onChange={(e) => updateMealInfo(selectedMeal, { name: e.target.value })}
                            placeholder="Meal name"
                            className="flex-1 h-8 font-medium"
                          />
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={meals[selectedMeal].time}
                              onChange={(e) => updateMealInfo(selectedMeal, { time: e.target.value })}
                              className="w-28 h-8"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-4">
                        {meals[selectedMeal].foods.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {meals[selectedMeal].foods.map((f, fIdx) => (
                              <div 
                                key={fIdx} 
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                              >
                                <Apple className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1 font-medium text-sm">{f.food.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {f.quantity} {f.unit}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {f.calories} kcal
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeFoodFromMeal(selectedMeal, fIdx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground mb-4">
                            <Apple className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No foods added yet</p>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowFoodPicker(true)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Food
                        </Button>

                        {/* Food Picker */}
                        {showFoodPicker && (
                          <Card className="mt-4 border-2 border-primary">
                            <CardHeader className="py-3 px-4">
                              <CardTitle className="text-base">Add Food</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-4 pb-4">
                              <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search foods..."
                                  value={foodSearch}
                                  onChange={(e) => setFoodSearch(e.target.value)}
                                  className="pl-9"
                                />
                              </div>

                              {!selectedFood ? (
                                <ScrollArea className="h-48">
                                  <div className="space-y-1">
                                    {searchedFoods?.map((food) => (
                                      <Button
                                        key={food.id}
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => {
                                          setSelectedFood(food);
                                          setFoodUnit(food.default_serving_unit || "g");
                                          setFoodQuantity(food.default_serving_size || 100);
                                        }}
                                      >
                                        <Apple className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <span className="flex-1 text-left">{food.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {food.calories_per_100g} kcal/100g
                                        </span>
                                      </Button>
                                    ))}
                                    {(!searchedFoods || searchedFoods.length === 0) && foodSearch.length >= 2 && (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No foods found
                                      </p>
                                    )}
                                    {foodSearch.length < 2 && (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        Type at least 2 characters to search
                                      </p>
                                    )}
                                  </div>
                                </ScrollArea>
                              ) : (
                                <div className="space-y-4">
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="font-medium">{selectedFood.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedFood.calories_per_100g} kcal • P: {selectedFood.protein_per_100g}g • C: {selectedFood.carbs_per_100g}g • F: {selectedFood.fat_per_100g}g per 100g
                                    </p>
                                  </div>

                                  <div className="flex gap-3">
                                    <div className="flex-1">
                                      <label className="text-sm font-medium mb-1 block">Quantity</label>
                                      <Input
                                        type="number"
                                        value={foodQuantity}
                                        onChange={(e) => setFoodQuantity(parseFloat(e.target.value) || 0)}
                                        min={0}
                                      />
                                    </div>
                                    <div className="w-32">
                                      <label className="text-sm font-medium mb-1 block">Unit</label>
                                      <Select value={foodUnit} onValueChange={setFoodUnit}>
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

                                  {foodQuantity > 0 && (
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                      {(() => {
                                        const nutrition = calculateNutrition(selectedFood, foodQuantity, foodUnit);
                                        return (
                                          <p className="text-sm">
                                            <strong>{nutrition.calories} kcal</strong> • P: {nutrition.protein}g • C: {nutrition.carbs}g • F: {nutrition.fat}g
                                          </p>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-4 flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowFoodPicker(false);
                                    setSelectedFood(null);
                                    setFoodSearch("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                {selectedFood && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={addFoodToMeal}
                                  >
                                    Add
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-lg">{form.getValues("name")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                          <p className="text-xl font-bold">{dayTotals.calories || form.getValues("calories_target")}</p>
                          <p className="text-xs text-muted-foreground">Calories</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Beef className="w-5 h-5 text-red-500 mx-auto mb-1" />
                          <p className="text-xl font-bold">{Math.round(dayTotals.protein) || form.getValues("protein_grams")}g</p>
                          <p className="text-xs text-muted-foreground">Protein</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                          <p className="text-xl font-bold">{Math.round(dayTotals.carbs) || form.getValues("carbs_grams")}g</p>
                          <p className="text-xs text-muted-foreground">Carbs</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Droplet className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                          <p className="text-xl font-bold">{Math.round(dayTotals.fat) || form.getValues("fat_grams")}g</p>
                          <p className="text-xs text-muted-foreground">Fat</p>
                        </div>
                      </div>

                      {form.getValues("description") && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {form.getValues("description")}
                        </p>
                      )}

                      <div className="space-y-3">
                        {meals.map((meal, idx) => {
                          const mealTotals = calculateMealTotals(meal);
                          return (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{meal.name}</h4>
                                {mealTotals.calories > 0 && (
                                  <Badge variant="secondary">{mealTotals.calories} kcal</Badge>
                                )}
                              </div>
                              {meal.foods.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {meal.foods.map((f, fIdx) => (
                                    <Badge key={fIdx} variant="outline" className="text-xs">
                                      {f.food.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No foods added</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-between gap-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? () => onOpenChange(false) : handleBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          {step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
