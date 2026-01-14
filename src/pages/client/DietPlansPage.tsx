import { useState } from "react";
import { Search, Utensils, Flame, Beef, Wheat, Droplet, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDietPlans, DietPlan } from "@/hooks/useDietPlans";
import { DietPlanDetailSheet } from "@/components/diet/DietPlanDetailSheet";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { MyPlansSection } from "@/components/plans/MyPlansSection";

const goalLabels: Record<string, string> = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  maintenance: "Maintenance",
  performance: "Performance",
  general_health: "General Health",
};

const dietaryLabels: Record<string, string> = {
  standard: "Standard",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  keto: "Keto",
  paleo: "Paleo",
  mediterranean: "Mediterranean",
  low_carb: "Low Carb",
  high_protein: "High Protein",
};

export default function ClientDietPlansPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);

  const { data: plans = [], isLoading } = useDietPlans();

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clients see system plans and plans assigned to them
  const systemPlans = filteredPlans.filter((p) => p.is_system);

  return (
    <div className="space-y-6">
      {/* My Active Diet Plans */}
      <MyPlansSection planType="diet" title="My Active Diet Plans" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diet Plans</h1>
          <p className="text-muted-foreground">Browse nutrition plans and meal guides</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search plans..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {systemPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Plans</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemPlans.map((plan) => (
                  <DietPlanCard
                    key={plan.id}
                    plan={plan}
                    onView={() => setSelectedPlan(plan)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredPlans.length === 0 && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No diet plans found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "No diet plans available yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <DietPlanDetailSheet
        plan={selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      />
    </div>
  );
}

function DietPlanCard({
  plan,
  onView,
}: {
  plan: DietPlan;
  onView: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-base">{plan.name}</CardTitle>
              {plan.description && (
                <CardDescription className="line-clamp-2 text-xs">{plan.description}</CardDescription>
              )}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="diet_plan" itemId={plan.id} size="sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {plan.is_system && (
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
              <Shield className="w-3 h-3 mr-1" />
              System
            </Badge>
          )}
          {plan.goal && (
            <Badge variant="secondary">{goalLabels[plan.goal] || plan.goal}</Badge>
          )}
          {plan.dietary_type && (
            <Badge variant="outline">{dietaryLabels[plan.dietary_type] || plan.dietary_type}</Badge>
          )}
        </div>

        {plan.calories_target && (
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
              <Flame className="h-4 w-4 text-orange-500 mb-1" />
              <span className="font-medium">{plan.calories_target}</span>
              <span className="text-xs text-muted-foreground">kcal</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
              <Beef className="h-4 w-4 text-red-500 mb-1" />
              <span className="font-medium">{plan.protein_grams || 0}g</span>
              <span className="text-xs text-muted-foreground">protein</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
              <Wheat className="h-4 w-4 text-amber-500 mb-1" />
              <span className="font-medium">{plan.carbs_grams || 0}g</span>
              <span className="text-xs text-muted-foreground">carbs</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
              <Droplet className="h-4 w-4 text-yellow-500 mb-1" />
              <span className="font-medium">{plan.fat_grams || 0}g</span>
              <span className="text-xs text-muted-foreground">fat</span>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {plan.meals_per_day} meals per day
        </div>
      </CardContent>
    </Card>
  );
}
