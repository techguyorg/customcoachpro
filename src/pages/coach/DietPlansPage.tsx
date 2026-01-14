import { useState } from "react";
import { Plus, Search, Utensils, Flame, Beef, Wheat, Droplet, Edit, Trash2, MoreVertical, Eye, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDietPlans, useDeleteDietPlan, DietPlan } from "@/hooks/useDietPlans";
import { DietPlanWizard } from "@/components/diet/DietPlanWizard";
import { DietPlanDetailSheet } from "@/components/diet/DietPlanDetailSheet";
import { QuickAssignDialog } from "@/components/coach/QuickAssignDialog";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

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

export default function DietPlansPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<DietPlan | null>(null);
  const [assignPlanId, setAssignPlanId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useDietPlans();
  const deleteMutation = useDeleteDietPlan();

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myPlans = filteredPlans.filter((p) => !p.is_system);
  const systemPlans = filteredPlans.filter((p) => p.is_system);

  const handleDelete = async () => {
    if (!deletingPlan) return;
    try {
      await deleteMutation.mutateAsync(deletingPlan.id);
      toast.success("Diet plan deleted");
      setDeletingPlan(null);
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Diet Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage nutrition plans for your clients</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
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
          {myPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">My Plans</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myPlans.map((plan) => (
                  <DietPlanCard
                    key={plan.id}
                    plan={plan}
                    onView={() => setSelectedPlan(plan)}
                    onEdit={() => setEditingPlan(plan)}
                    onDelete={() => setDeletingPlan(plan)}
                    onAssign={() => setAssignPlanId(plan.id)}
                    isOwner={plan.created_by === user?.id}
                  />
                ))}
              </div>
            </div>
          )}

          {systemPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">System Plans</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemPlans.map((plan) => (
                  <DietPlanCard
                    key={plan.id}
                    plan={plan}
                    onView={() => setSelectedPlan(plan)}
                    onAssign={() => setAssignPlanId(plan.id)}
                    isSystem
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
                  {searchQuery ? "Try a different search term" : "Create your first diet plan to get started"}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <DietPlanWizard
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <DietPlanWizard
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        editingPlan={editingPlan}
      />

      <DietPlanDetailSheet
        plan={selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      />

      <AlertDialog open={!!deletingPlan} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Diet Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPlan?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Assign Dialog */}
      <QuickAssignDialog
        open={!!assignPlanId}
        onOpenChange={(open) => !open && setAssignPlanId(null)}
        preselectedDietId={assignPlanId || undefined}
      />
    </div>
  );
}

function DietPlanCard({
  plan,
  onView,
  onEdit,
  onDelete,
  onAssign,
  isSystem,
  isOwner,
}: {
  plan: DietPlan;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  isSystem?: boolean;
  isOwner?: boolean;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            {plan.description && (
              <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <FavoriteButton itemType="diet_plan" itemId={plan.id} size="sm" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onAssign && (
                  <DropdownMenuItem onClick={onAssign}>
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Assign to Client
                  </DropdownMenuItem>
                )}
                {!isSystem && isOwner && onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </>
                )}
                {!isSystem && isOwner && onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {plan.goal && (
            <Badge variant="secondary">{goalLabels[plan.goal] || plan.goal}</Badge>
          )}
          {plan.dietary_type && (
            <Badge variant="outline">{dietaryLabels[plan.dietary_type] || plan.dietary_type}</Badge>
          )}
          {isSystem && <Badge>System</Badge>}
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
