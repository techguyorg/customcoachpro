import type { Meal } from "@/types";
import type { DietPlanPayload } from "@/services/dietPlanService";
import type { DietPlanTemplate } from "./DietPlanForm";

function buildMealSchedule(meals: Meal[], labels: string[]): { mealId: string; mealTime: string; order: number }[] {
  if (meals.length === 0) return [];

  return labels
    .map((label, idx) => ({
      mealId: meals[idx % meals.length].id,
      mealTime: label,
      order: idx + 1,
    }))
    .filter((m) => m.mealId);
}

function templatePayload(name: string, description: string, days: DietPlanPayload["days"]): DietPlanTemplate {
  return {
    name,
    description,
    payload: {
      name,
      description,
      days,
    },
  };
}

export function buildDietTemplates(meals: Meal[]): DietPlanTemplate[] {
  const threeMealSchedule = buildMealSchedule(meals, ["Breakfast", "Lunch", "Dinner"]);
  const fourMealSchedule = buildMealSchedule(meals, ["Breakfast", "Lunch", "Snack", "Dinner"]);

  const templates: DietPlanTemplate[] = [
    templatePayload("Lean loss rotation", "Lower carb weekdays with steady protein.", [
      {
        dayNumber: 1,
        targetCalories: 1800,
        targetProtein: 160,
        targetCarbs: 150,
        targetFat: 60,
        meals: threeMealSchedule,
      },
      {
        dayNumber: 2,
        targetCalories: 1900,
        targetProtein: 160,
        targetCarbs: 180,
        targetFat: 65,
        meals: threeMealSchedule,
      },
    ]),
    templatePayload("Muscle gain push", "Higher calories and carbs for training days.", [
      {
        dayNumber: 1,
        targetCalories: 2800,
        targetProtein: 190,
        targetCarbs: 320,
        targetFat: 85,
        meals: fourMealSchedule,
      },
      {
        dayNumber: 2,
        targetCalories: 2600,
        targetProtein: 185,
        targetCarbs: 260,
        targetFat: 80,
        meals: fourMealSchedule,
      },
    ]),
    templatePayload("Balanced maintenance", "Simple daily template for habit building.", [
      {
        dayNumber: 1,
        targetCalories: 2200,
        targetProtein: 160,
        targetCarbs: 240,
        targetFat: 70,
        meals: threeMealSchedule,
      },
    ]),
  ];

  return templates;
}
