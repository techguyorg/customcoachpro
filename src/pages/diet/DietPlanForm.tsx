import { useMemo, useState } from "react";
import { Plus, Trash2, ChefHat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { DietPlan, Meal } from "@/types";
import type { DietPlanPayload, DietPlanTemplate } from "@/services/dietPlanService";

type DietMealForm = {
  id: string;
  mealId: string;
  mealTime: string;
  order: number;
};

type DietDayForm = {
  id: string;
  dayNumber: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: DietMealForm[];
};

type DietPlanFormProps = {
  meals: Meal[];
  templates?: DietPlanTemplate[];
  initialData?: DietPlan;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: DietPlanPayload) => Promise<void>;
};

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function toFormState(plan?: DietPlan): { name: string; description: string; days: DietDayForm[] } {
  if (!plan) {
    return {
      name: "",
      description: "",
      days: [
        {
          id: generateId(),
          dayNumber: 1,
          targetCalories: 2000,
          targetProtein: 140,
          targetCarbs: 220,
          targetFat: 70,
          meals: [],
        },
      ],
    };
  }

  return {
    name: plan.name,
    description: plan.description ?? "",
    days: plan.days
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((day, idx) => ({
        id: day.id || generateId(),
        dayNumber: day.dayNumber || idx + 1,
        targetCalories: day.targetCalories,
        targetProtein: day.targetProtein,
        targetCarbs: day.targetCarbs,
        targetFat: day.targetFat,
        meals: (day.meals || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((meal, mealIdx) => ({
            id: meal.id || generateId(),
            mealId: meal.mealId,
            mealTime: meal.mealTime,
            order: meal.order || mealIdx + 1,
          })),
      })),
  };
}

function payloadToForm(payload: DietPlanPayload): { name: string; description: string; days: DietDayForm[] } {
  return {
    name: payload.name,
    description: payload.description ?? "",
    days: payload.days.map((day, idx) => ({
      id: generateId(),
      dayNumber: day.dayNumber || idx + 1,
      targetCalories: day.targetCalories,
      targetProtein: day.targetProtein,
      targetCarbs: day.targetCarbs,
      targetFat: day.targetFat,
      meals: (day.meals || []).map((meal, mealIdx) => ({
        id: generateId(),
        mealId: meal.mealId,
        mealTime: meal.mealTime,
        order: meal.order || mealIdx + 1,
      })),
    })),
  };
}

export function DietPlanForm({
  meals,
  templates,
  initialData,
  title,
  description,
  submitLabel,
  isSubmitting,
  onCancel,
  onSubmit,
}: DietPlanFormProps) {
  const [planName, setPlanName] = useState(initialData?.name ?? "");
  const [planDescription, setPlanDescription] = useState(initialData?.description ?? "");
  const [days, setDays] = useState<DietDayForm[]>(() => toFormState(initialData).days);

  const totalMeals = useMemo(() => days.reduce((acc, day) => acc + day.meals.length, 0), [days]);

  const addDay = () => {
    setDays((prev) => [
      ...prev,
      {
        id: generateId(),
        dayNumber: prev.length + 1,
        targetCalories: 2000,
        targetProtein: 140,
        targetCarbs: 220,
        targetFat: 70,
        meals: [],
      },
    ]);
  };

  const removeDay = (dayId: string) => {
    setDays((prev) => prev.filter((d) => d.id !== dayId).map((d, idx) => ({ ...d, dayNumber: idx + 1 })));
  };

  const updateDay = (dayId: string, updates: Partial<DietDayForm>) => {
    setDays((prev) => prev.map((day) => (day.id === dayId ? { ...day, ...updates } : day)));
  };

  const addMeal = (dayId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: [
                ...day.meals,
                {
                  id: generateId(),
                  mealId: meals[0]?.id ?? "",
                  mealTime: "Meal",
                  order: day.meals.length + 1,
                },
              ],
            }
          : day
      )
    );
  };

  const updateMeal = (dayId: string, mealId: string, updates: Partial<DietMealForm>) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.map((meal) => (meal.id === mealId ? { ...meal, ...updates } : meal)),
            }
          : day
      )
    );
  };

  const removeMeal = (dayId: string, mealId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              meals: day.meals.filter((meal) => meal.id !== mealId).map((meal, idx) => ({ ...meal, order: idx + 1 })),
            }
          : day
      )
    );
  };

  const applyTemplate = (template: DietPlanTemplate) => {
    const formState = payloadToForm(template.payload);
    setPlanName(formState.name);
    setPlanDescription(formState.description);
    setDays(formState.days);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = planName.trim();
    if (!trimmedName) return;

    const payload: DietPlanPayload = {
      name: trimmedName,
      description: planDescription.trim() || undefined,
      days: days.map((day, idx) => ({
        dayNumber: idx + 1,
        targetCalories: Number(day.targetCalories) || 0,
        targetProtein: Number(day.targetProtein) || 0,
        targetCarbs: Number(day.targetCarbs) || 0,
        targetFat: Number(day.targetFat) || 0,
        meals: day.meals.map((meal, mealIdx) => ({
          mealId: meal.mealId,
          mealTime: meal.mealTime || `Meal ${mealIdx + 1}`,
          order: mealIdx + 1,
        })),
      })),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground hidden md:block">
          <div>Total days: {days.length}</div>
          <div>Total meals: {totalMeals}</div>
        </div>
      </div>

      {templates && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Quick-start templates
            </CardTitle>
            <CardDescription>Apply a structure you can tweak before saving.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {templates.map((template) => (
              <div key={template.name} className="border rounded-lg p-3 space-y-2">
                <div className="font-medium">{template.name}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => applyTemplate(template)}>
                  Use template
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
          <CardDescription>Describe the goal of this nutrition plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diet-plan-name">Plan name</Label>
            <Input
              id="diet-plan-name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. Lean bulk 6-week"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diet-plan-description">Description</Label>
            <Textarea
              id="diet-plan-description"
              rows={3}
              placeholder="Who is this for and what are the macro targets?"
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between space-y-0">
          <div>
            <CardTitle>Days & meals</CardTitle>
            <CardDescription>Set macro targets and schedule meals for each day.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addDay}>
            <Plus className="h-4 w-4 mr-2" />
            Add day
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((day) => (
            <div key={day.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Day number</Label>
                    <Input
                      type="number"
                      min={1}
                      value={day.dayNumber}
                      onChange={(e) => updateDay(day.id, { dayNumber: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target calories</Label>
                    <Input
                      type="number"
                      min={0}
                      value={day.targetCalories}
                      onChange={(e) => updateDay(day.id, { targetCalories: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Protein (g)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={day.targetProtein}
                      onChange={(e) => updateDay(day.id, { targetProtein: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Carbs (g)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={day.targetCarbs}
                      onChange={(e) => updateDay(day.id, { targetCarbs: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fat (g)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={day.targetFat}
                      onChange={(e) => updateDay(day.id, { targetFat: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDay(day.id)}
                  disabled={days.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="space-y-3">
                {day.meals.map((meal) => (
                  <div key={meal.id} className="border rounded-md p-3 space-y-3 bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                        <div className="space-y-1.5">
                          <Label>Meal</Label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={meal.mealId}
                            onChange={(e) => updateMeal(day.id, meal.id, { mealId: e.target.value })}
                          >
                            {meals.length === 0 && <option value="">Create a meal first</option>}
                            {meals.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Time</Label>
                          <Input
                            value={meal.mealTime}
                            onChange={(e) => updateMeal(day.id, meal.id, { mealTime: e.target.value })}
                            placeholder="Breakfast / Lunch / Dinner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Order</Label>
                          <Input
                            type="number"
                            min={1}
                            value={meal.order}
                            onChange={(e) => updateMeal(day.id, meal.id, { order: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMeal(day.id, meal.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={() => addMeal(day.id)} disabled={meals.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                {meals.length === 0 ? "Add meals after creating them" : "Add meal"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="shadow-energy" disabled={isSubmitting || !planName.trim()}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default DietPlanForm;
