import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Flame, Beef, Wheat, Droplet, ArrowLeftRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCreateDietPlan, useUpdateDietPlan, DietPlan } from "@/hooks/useDietPlans";
import { MealFoodBuilder, MealFoodItem } from "./MealFoodBuilder";
import { FoodAlternative, FoodAlternativesDialog } from "./FoodAlternatives";
import { calculateCalories } from "@/hooks/useFoods";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const mealSchema = z.object({
  meal_number: z.number(),
  meal_name: z.string().min(1, "Meal name required"),
  time_suggestion: z.string().optional(),
  calories: z.number().optional(),
  protein_grams: z.number().optional(),
  carbs_grams: z.number().optional(),
  fat_grams: z.number().optional(),
  food_suggestions: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

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
  meals: z.array(mealSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan?: DietPlan | null;
  isSystemContent?: boolean;
}

const defaultMeals = [
  { meal_number: 1, meal_name: "Breakfast", time_suggestion: "07:00" },
  { meal_number: 2, meal_name: "Lunch", time_suggestion: "12:00" },
  { meal_number: 3, meal_name: "Snack", time_suggestion: "15:00" },
  { meal_number: 4, meal_name: "Dinner", time_suggestion: "19:00" },
];

export function CreateDietPlanDialog({ open, onOpenChange, editingPlan, isSystemContent = false }: Props) {
  const [activeTab, setActiveTab] = useState("basics");
  const [useFoodBuilder, setUseFoodBuilder] = useState(true);
  const [mealFoods, setMealFoods] = useState<Record<number, MealFoodItem[]>>({});
  const [alternatives, setAlternatives] = useState<FoodAlternative[]>([]);
  const [showAlternativesDialog, setShowAlternativesDialog] = useState(false);
  
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");
  const createMutation = useCreateDietPlan();
  const updateMutation = useUpdateDietPlan();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      dietary_type: "standard",
      calories_target: undefined,
      protein_grams: undefined,
      carbs_grams: undefined,
      fat_grams: undefined,
      meals_per_day: 4,
      notes: "",
      meals: defaultMeals,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  // Watch macros for auto-calculation
  const proteinGrams = form.watch("protein_grams");
  const carbsGrams = form.watch("carbs_grams");
  const fatGrams = form.watch("fat_grams");

  // Auto-calculate calories when macros change
  useEffect(() => {
    if (proteinGrams || carbsGrams || fatGrams) {
      const calculatedCalories = calculateCalories(
        proteinGrams || 0,
        carbsGrams || 0,
        fatGrams || 0
      );
      if (calculatedCalories > 0) {
        form.setValue("calories_target", calculatedCalories);
      }
    }
  }, [proteinGrams, carbsGrams, fatGrams, form]);

  useEffect(() => {
    if (editingPlan) {
      form.reset({
        name: editingPlan.name,
        description: editingPlan.description || "",
        goal: editingPlan.goal || "",
        dietary_type: editingPlan.dietary_type || "standard",
        calories_target: editingPlan.calories_target || undefined,
        protein_grams: editingPlan.protein_grams || undefined,
        carbs_grams: editingPlan.carbs_grams || undefined,
        fat_grams: editingPlan.fat_grams || undefined,
        meals_per_day: editingPlan.meals_per_day || 4,
        notes: editingPlan.notes || "",
        meals: editingPlan.meals?.map((m) => ({
          meal_number: m.meal_number,
          meal_name: m.meal_name,
          time_suggestion: m.time_suggestion || "",
          calories: m.calories || undefined,
          protein_grams: m.protein_grams || undefined,
          carbs_grams: m.carbs_grams || undefined,
          fat_grams: m.fat_grams || undefined,
          food_suggestions: m.food_suggestions || [],
          notes: m.notes || "",
        })) || defaultMeals,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        goal: "",
        dietary_type: "standard",
        calories_target: undefined,
        protein_grams: undefined,
        carbs_grams: undefined,
        fat_grams: undefined,
        meals_per_day: 4,
        notes: "",
        meals: defaultMeals,
      });
      setMealFoods({});
      setAlternatives([]);
    }
  }, [editingPlan, form, open]);

  // Calculate totals from food builder
  const calculateMealTotals = (mealIndex: number) => {
    const foods = mealFoods[mealIndex] || [];
    return foods.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutrition.calories,
        protein: acc.protein + item.nutrition.protein,
        carbs: acc.carbs + item.nutrition.carbs,
        fat: acc.fat + item.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const calculateDayTotals = (): { calories: number; protein: number; carbs: number; fat: number } => {
    if (!useFoodBuilder) {
      const meals = form.getValues("meals") || [];
      let calories = 0, protein = 0, carbs = 0, fat = 0;
      for (const meal of meals) {
        calories += meal.calories || 0;
        protein += meal.protein_grams || 0;
        carbs += meal.carbs_grams || 0;
        fat += meal.fat_grams || 0;
      }
      return { calories, protein, carbs, fat };
    }

    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const key of Object.keys(mealFoods)) {
      const mealTotal = calculateMealTotals(parseInt(key));
      calories += mealTotal.calories;
      protein += mealTotal.protein;
      carbs += mealTotal.carbs;
      fat += mealTotal.fat;
    }
    return { calories, protein, carbs, fat };
  };

  const onSubmit = async (data: FormData) => {
    try {
      // If using food builder, update meal macros from foods
      const mealsWithMacros = data.meals?.map((m, idx) => {
        if (useFoodBuilder) {
          const totals = calculateMealTotals(idx);
          return {
            meal_number: idx + 1,
            meal_name: m.meal_name,
            time_suggestion: m.time_suggestion || null,
            calories: totals.calories || null,
            protein_grams: Math.round(totals.protein) || null,
            carbs_grams: Math.round(totals.carbs) || null,
            fat_grams: Math.round(totals.fat) || null,
            food_suggestions: (mealFoods[idx] || []).map(f => f.food.name),
            notes: m.notes || null,
          };
        }
        return {
          meal_number: idx + 1,
          meal_name: m.meal_name,
          time_suggestion: m.time_suggestion || null,
          calories: m.calories || null,
          protein_grams: m.protein_grams || null,
          carbs_grams: m.carbs_grams || null,
          fat_grams: m.fat_grams || null,
          food_suggestions: m.food_suggestions || null,
          notes: m.notes || null,
        };
      });

      const dayTotals = calculateDayTotals();

      const planData = {
        name: data.name,
        description: data.description || null,
        goal: data.goal || null,
        dietary_type: data.dietary_type || null,
        calories_target: useFoodBuilder ? dayTotals.calories : (data.calories_target || null),
        protein_grams: useFoodBuilder ? Math.round(dayTotals.protein) : (data.protein_grams || null),
        carbs_grams: useFoodBuilder ? Math.round(dayTotals.carbs) : (data.carbs_grams || null),
        fat_grams: useFoodBuilder ? Math.round(dayTotals.fat) : (data.fat_grams || null),
        meals_per_day: data.meals_per_day,
        notes: data.notes || null,
        is_system: isSuperAdmin && isSystemContent,
        is_active: true,
      };

      if (editingPlan) {
        await updateMutation.mutateAsync({
          id: editingPlan.id,
          plan: planData,
          meals: mealsWithMacros,
        });
        toast.success("Diet plan updated");
      } else {
        await createMutation.mutateAsync({ plan: planData, meals: mealsWithMacros });
        toast.success("Diet plan created");
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save diet plan");
    }
  };

  const addMeal = () => {
    append({
      meal_number: fields.length + 1,
      meal_name: `Meal ${fields.length + 1}`,
      time_suggestion: "",
    });
  };

  const getAllFoods = () => {
    return Object.values(mealFoods).flat().map(item => item.food);
  };

  const dayTotals = calculateDayTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? "Edit Diet Plan" : "Create Diet Plan"}</DialogTitle>
          <DialogDescription>
            {editingPlan ? "Update the diet plan details" : "Create a custom nutrition plan for your clients"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="macros">Macros</TabsTrigger>
                <TabsTrigger value="meals">Meals</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
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
                        <Textarea 
                          placeholder="Describe the diet plan..." 
                          {...field} 
                        />
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes or instructions..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="macros" className="space-y-4 mt-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-calculate from meals</p>
                        <p className="text-sm text-muted-foreground">
                          Calories are calculated using: P×4 + C×4 + F×9
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={useFoodBuilder}
                          onCheckedChange={setUseFoodBuilder}
                        />
                        <Label>Use food builder</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {!useFoodBuilder && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="protein_grams"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein (g)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 180"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                            <FormLabel>Carbs (g)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 250"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                            <FormLabel>Fat (g)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 80"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="calories_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Calories (auto-calculated)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 2500"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {useFoodBuilder && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Daily Totals (from meals)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                          <Flame className="h-5 w-5 text-orange-500 mb-1" />
                          <span className="font-bold text-lg">{dayTotals.calories}</span>
                          <span className="text-xs text-muted-foreground">kcal</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                          <Beef className="h-5 w-5 text-red-500 mb-1" />
                          <span className="font-bold text-lg">{dayTotals.protein.toFixed(0)}g</span>
                          <span className="text-xs text-muted-foreground">protein</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                          <Wheat className="h-5 w-5 text-amber-500 mb-1" />
                          <span className="font-bold text-lg">{dayTotals.carbs.toFixed(0)}g</span>
                          <span className="text-xs text-muted-foreground">carbs</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                          <Droplet className="h-5 w-5 text-yellow-500 mb-1" />
                          <span className="font-bold text-lg">{dayTotals.fat.toFixed(0)}g</span>
                          <span className="text-xs text-muted-foreground">fat</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="meals_per_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meals Per Day</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(parseInt(v))} 
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} meals
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="meals" className="space-y-4 mt-4">
                {useFoodBuilder && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAlternativesDialog(true)}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Manage Alternatives ({alternatives.length})
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    useFoodBuilder ? (
                      <div key={field.id} className="relative">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 text-destructive z-10"
                            onClick={() => {
                              remove(index);
                              const newMealFoods = { ...mealFoods };
                              delete newMealFoods[index];
                              // Reindex remaining meals
                              const reindexed: Record<number, MealFoodItem[]> = {};
                              Object.keys(newMealFoods).forEach((key) => {
                                const oldIdx = parseInt(key);
                                const newIdx = oldIdx > index ? oldIdx - 1 : oldIdx;
                                reindexed[newIdx] = newMealFoods[oldIdx];
                              });
                              setMealFoods(reindexed);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <MealFoodBuilder
                          mealName={form.watch(`meals.${index}.meal_name`) || `Meal ${index + 1}`}
                          items={mealFoods[index] || []}
                          onItemsChange={(items) => setMealFoods({ ...mealFoods, [index]: items })}
                          timeSuggestion={form.watch(`meals.${index}.time_suggestion`)}
                          onTimeChange={(time) => form.setValue(`meals.${index}.time_suggestion`, time)}
                          alternatives={alternatives}
                          onAlternativesChange={setAlternatives}
                          showAlternatives={true}
                        />
                        <div className="mt-2">
                          <FormField
                            control={form.control}
                            name={`meals.${index}.meal_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="Meal name" 
                                    {...field}
                                    className="max-w-xs"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ) : (
                      <Card key={field.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="font-medium">Meal {index + 1}</h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`meals.${index}.meal_name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Meal Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Breakfast" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`meals.${index}.time_suggestion`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <FormField
                                control={form.control}
                                name={`meals.${index}.protein_grams`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Protein (g)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="g"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`meals.${index}.carbs_grams`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Carbs (g)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="g"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`meals.${index}.fat_grams`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Fat (g)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="g"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`meals.${index}.calories`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Calories</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="kcal"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                        value={field.value || ""}
                                        className="bg-muted"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name={`meals.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Food Suggestions</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="List recommended foods..."
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={addMeal} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal
                </Button>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </form>
        </Form>

        <FoodAlternativesDialog
          open={showAlternativesDialog}
          onOpenChange={setShowAlternativesDialog}
          foods={getAllFoods()}
          alternatives={alternatives}
          onAlternativesChange={setAlternatives}
        />
      </DialogContent>
    </Dialog>
  );
}
