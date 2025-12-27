import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Utensils, MoreHorizontal, Trash2, Users, ChefHat, Soup, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import type { DietPlan, Meal } from "@/types";
import foodService, { type FoodPayload } from "@/services/foodService";
import mealService, { type MealPayload } from "@/services/mealService";
import dietPlanService, { type DietPlanPayload } from "@/services/dietPlanService";
import { buildDietTemplates } from "./templates";

const foodMacroLabels: { key: keyof Pick<FoodPayload, "calories" | "protein" | "carbs" | "fat">; label: string }[] = [
  { key: "calories", label: "calories" },
  { key: "protein", label: "protein (g)" },
  { key: "carbs", label: "carbs (g)" },
  { key: "fat", label: "fat (g)" },
];

function PlanCard({ plan, onAssign, onDelete }: { plan: DietPlan; onAssign: () => void; onDelete: () => void }) {
  const navigate = useNavigate();
  const avgCalories = plan.days.length
    ? plan.days.reduce((sum, d) => sum + d.targetCalories, 0) / plan.days.length
    : 0;
  const avgProtein = plan.days.length
    ? plan.days.reduce((sum, d) => sum + d.targetProtein, 0) / plan.days.length
    : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all group"
      onClick={() => navigate(`/diet-plans/${plan.id}/edit`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-icon-diet/10 group-hover:bg-icon-diet/20 transition-colors">
              <Utensils className="h-5 w-5 text-icon-diet" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.days.length} day cycle</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/diet-plans/${plan.id}/edit`);
                }}
              >
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign();
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Assign to Client
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plan.description || "No description"}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline">{Math.round(avgCalories)} cal</Badge>
            <Badge variant="outline">{Math.round(avgProtein)}g protein</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {new Date(plan.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DietPlansPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [foodForm, setFoodForm] = useState<FoodPayload>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: "1 serving",
  });
  const [mealForm, setMealForm] = useState<MealPayload>({
    name: "",
    description: "",
    foods: [{ foodId: "", quantity: 1 }],
  });

  const { data: foods = [], isLoading: foodsLoading } = useQuery({
    queryKey: ["foods"],
    queryFn: () => foodService.list(),
  });

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["meals"],
    queryFn: () => mealService.list(),
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["diet-plans"],
    queryFn: () => dietPlanService.list(),
  });

  const { data: remoteTemplates = [] } = useQuery({
    queryKey: ["diet-plan-templates"],
    queryFn: () => dietPlanService.templates(),
    retry: false,
  });

  const templates = useMemo(
    () => (remoteTemplates.length ? remoteTemplates : buildDietTemplates(meals)),
    [remoteTemplates, meals]
  );

  useEffect(() => {
    if (foods.length === 0) return;
    setMealForm((prev) => {
      if (prev.foods.some((f) => f.foodId)) return prev;
      return {
        ...prev,
        foods: prev.foods.map((f, idx) => ({ ...f, foodId: foods[idx % foods.length]?.id ?? f.foodId })),
      };
    });
  }, [foods]);

  const createFoodMutation = useMutation({
    mutationFn: (payload: FoodPayload) => foodService.create(payload),
    onSuccess: () => {
      toast({ title: "Food saved" });
      setFoodForm({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: "1 serving" });
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to save food",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createMealMutation = useMutation({
    mutationFn: (payload: MealPayload) => mealService.create(payload),
    onSuccess: () => {
      toast({ title: "Meal saved" });
      setMealForm({ name: "", description: "", foods: [{ foodId: foods[0]?.id ?? "", quantity: 1 }] });
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to save meal",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: DietPlanPayload) => dietPlanService.create(payload),
    onSuccess: () => {
      toast({ title: "Diet plan created" });
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to create plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => dietPlanService.remove(planId),
    onSuccess: () => {
      toast({ title: "Diet plan deleted" });
      queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to delete plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (planId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this diet plan?");
    if (!confirmDelete) return;
    deletePlanMutation.mutate(planId);
  };

  const handleFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name.trim()) return;
    createFoodMutation.mutate({ ...foodForm, name: foodForm.name.trim() });
  };

  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.name.trim()) return;
    const foodsPayload = mealForm.foods.filter((f) => f.foodId && f.quantity > 0);
    if (!foodsPayload.length) {
      toast({ title: "Add foods to the meal", description: "Choose at least one food item." });
      return;
    }
    createMealMutation.mutate({ ...mealForm, name: mealForm.name.trim(), foods: foodsPayload });
  };

  const addMealFoodRow = () => {
    setMealForm((prev) => ({
      ...prev,
      foods: [...prev.foods, { foodId: foods[0]?.id ?? "", quantity: 1 }],
    }));
  };

  const updateMealFood = (idx: number, updates: Partial<MealPayload["foods"][number]>) => {
    setMealForm((prev) => ({
      ...prev,
      foods: prev.foods.map((item, i) => (i === idx ? { ...item, ...updates } : item)),
    }));
  };

  const removeMealFood = (idx: number) => {
    setMealForm((prev) => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== idx),
    }));
  };

  const handleUseTemplate = (payload: DietPlanPayload) => {
    createPlanMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Diet Plans"
        description="Create and manage diet plans, meals, and foods"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/diet-plans/new")}>
              <Soup className="h-4 w-4 mr-2" />
              Build custom
            </Button>
            <Button onClick={() => navigate("/diet-plans/new")} className="shadow-energy">
              <Plus className="h-4 w-4 mr-2" />
              New plan
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="foods">Foods</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" /> Templates
                </CardTitle>
                <CardDescription>Start quickly and tweak after creation.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/diet-plans/new")}>Custom build</Button>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-3 md:grid-cols-2">
              {templates.map((template) => (
                <div key={template.name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-icon-diet" />
                    <div className="font-medium">{template.name}</div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  <div className="flex gap-2">
                    {template.payload.days.map((day) => (
                      <Badge key={day.dayNumber} variant="outline">
                        Day {day.dayNumber}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUseTemplate(template.payload)}
                    disabled={createPlanMutation.isPending}
                  >
                    {createPlanMutation.isPending ? "Creating..." : "Use template"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {!plansLoading && plans.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No diet plans yet"
              description="Create your first diet plan to start managing your clients' nutrition."
              actionLabel="Create Diet Plan"
              onAction={() => navigate("/diet-plans/new")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onAssign={() => navigate(`/diet-plans/${plan.id}/assign`)}
                  onDelete={() => handleDelete(plan.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create meal</CardTitle>
                <CardDescription>Combine foods into reusable meals.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleMealSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="meal-name">Name</Label>
                    <Input
                      id="meal-name"
                      value={mealForm.name}
                      onChange={(e) => setMealForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. High-protein lunch"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meal-description">Description</Label>
                    <Textarea
                      id="meal-description"
                      value={mealForm.description ?? ""}
                      onChange={(e) => setMealForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional context for when to use this meal"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Foods</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addMealFoodRow} disabled={foods.length === 0}>
                        Add food
                      </Button>
                    </div>
                    {mealForm.foods.map((item, idx) => (
                      <div key={`${item.foodId}-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1.5 md:col-span-2">
                          <Label>Food</Label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={item.foodId}
                            onChange={(e) => updateMealFood(idx, { foodId: e.target.value })}
                          >
                            <option value="" disabled>
                              {foodsLoading ? "Loading foods..." : "Select a food"}
                            </option>
                            {foods.map((food) => (
                              <option key={food.id} value={food.id}>
                                {food.name} ({food.servingSize})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={item.quantity}
                            onChange={(e) => updateMealFood(idx, { quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeMealFood(idx)} disabled={mealForm.foods.length === 1}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="shadow-energy" disabled={createMealMutation.isPending || foods.length === 0}>
                      {createMealMutation.isPending ? "Saving..." : "Save meal"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meals library</CardTitle>
                <CardDescription>Reusable meals with macro totals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mealsLoading ? (
                  <p className="text-muted-foreground">Loading meals...</p>
                ) : meals.length === 0 ? (
                  <p className="text-muted-foreground">Create a meal to see it listed here.</p>
                ) : (
                  meals.map((meal) => (
                    <div key={meal.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{meal.name}</div>
                          <p className="text-sm text-muted-foreground">{meal.description || "No description"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{meal.totalCalories} cal</Badge>
                          <Badge variant="outline">{meal.totalProtein}g P</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {meal.foods.map((food) => (
                          <Badge key={food.id} variant="secondary">
                            {food.food?.name || "Food"} x{food.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="foods" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add food</CardTitle>
                <CardDescription>Track calories, macros, and serving size.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleFoodSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="food-name">Name</Label>
                    <Input
                      id="food-name"
                      value={foodForm.name}
                      onChange={(e) => setFoodForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Chicken breast"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {foodMacroLabels.map((macro) => (
                      <div key={macro.key} className="space-y-1.5">
                        <Label className="capitalize">{macro.label}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={foodForm[macro.key]}
                          onChange={(e) => setFoodForm((prev) => ({ ...prev, [macro.key]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Serving size</Label>
                    <Input
                      value={foodForm.servingSize}
                      onChange={(e) => setFoodForm((prev) => ({ ...prev, servingSize: e.target.value }))}
                      placeholder="e.g. 4 oz"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="shadow-energy" disabled={createFoodMutation.isPending}>
                      {createFoodMutation.isPending ? "Saving..." : "Save food"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Foods library</CardTitle>
                <CardDescription>Reference foods you can reuse in meals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {foodsLoading ? (
                  <p className="text-muted-foreground">Loading foods...</p>
                ) : foods.length === 0 ? (
                  <p className="text-muted-foreground">Add foods to build meals faster.</p>
                ) : (
                  foods.map((food) => (
                    <div key={food.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-medium">{food.name}</div>
                        <p className="text-sm text-muted-foreground">{food.servingSize}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{food.calories} cal</Badge>
                        <Badge variant="outline">{food.protein}g P</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DietPlansPage;
