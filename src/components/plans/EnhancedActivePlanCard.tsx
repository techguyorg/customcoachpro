import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  type PlanAssignmentWithDetails 
} from "@/hooks/usePlanAssignments";
import { DietPlan } from "@/hooks/useDietPlans";
import { 
  Dumbbell, 
  Utensils, 
  Calendar, 
  PauseCircle, 
  CheckCircle, 
  Clock, 
  Eye,
  User,
  Flame,
  Beef,
  Wheat,
  Droplet
} from "lucide-react";
import { format, differenceInDays, differenceInWeeks } from "date-fns";
import { TemplateDetailSheet } from "@/components/templates/TemplateDetailSheet";
import { DietPlanDetailSheet } from "@/components/diet/DietPlanDetailSheet";
import { useNutritionLog, calculateDailyTotals } from "@/hooks/useNutritionLog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedActivePlanCardProps {
  plan: PlanAssignmentWithDetails;
  onPause: () => void;
  onComplete: () => void;
  isPending: boolean;
  compact?: boolean;
}

export function EnhancedActivePlanCard({
  plan,
  onPause,
  onComplete,
  isPending,
  compact = false,
}: EnhancedActivePlanCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: todayNutrition = [] } = useNutritionLog();
  
  const isWorkout = plan.plan_type === "workout";
  const planDetails = isWorkout ? plan.workout_template : plan.diet_plan;
  const Icon = isWorkout ? Dumbbell : Utensils;
  // Self-assigned plans have coach_id === client_id
  const isCoachAssigned = plan.coach_id !== plan.client_id;
  
  const startDate = new Date(plan.start_date);
  const today = new Date();
  // Ensure we don't show negative values if start date is in the future
  const daysActive = Math.max(0, differenceInDays(today, startDate));
  const weeksActive = Math.max(0, differenceInWeeks(today, startDate));
  
  // Calculate progress if there's an end date or duration
  let progress = 0;
  let totalDuration = "";
  if (plan.end_date) {
    const endDate = new Date(plan.end_date);
    const totalDays = differenceInDays(endDate, startDate);
    progress = Math.min(100, Math.round((daysActive / totalDays) * 100));
    totalDuration = `${differenceInWeeks(endDate, startDate)} weeks`;
  } else if (isWorkout && plan.workout_template?.duration_weeks) {
    const totalDays = plan.workout_template.duration_weeks * 7;
    progress = Math.min(100, Math.round((daysActive / totalDays) * 100));
    totalDuration = `${plan.workout_template.duration_weeks} weeks`;
  }
  
  // Calculate today's macros for diet plans
  const todaysTotals = calculateDailyTotals(todayNutrition);
  const dietPlan = plan.diet_plan;
  
  const getMacroProgress = (consumed: number, target: number | null) => {
    if (!target) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open sheet if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setSheetOpen(true);
  };

  return (
    <TooltipProvider>
      <Card 
        className={`relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${compact ? '' : ''}`}
        onClick={handleCardClick}
      >
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-medium truncate">
                  {planDetails?.name || "Untitled Plan"}
                </CardTitle>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge 
                    variant={isCoachAssigned ? "default" : "secondary"} 
                    className="text-xs h-5"
                  >
                    {isCoachAssigned ? (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        Coach
                      </>
                    ) : "Self"}
                  </Badge>
                  {isWorkout && plan.workout_template?.difficulty && (
                    <Badge variant="outline" className="text-xs capitalize h-5">
                      {plan.workout_template.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pb-3">
          {/* Quick stats with tooltips */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Calendar className="w-3 h-3" />
                  <span>{format(startDate, "MMM d")}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Started on {format(startDate, "MMMM d, yyyy")}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <Clock className="w-3 h-3" />
                  <span>
                    {weeksActive > 0 ? `${weeksActive}w ` : ""}
                    {daysActive % 7}d
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{daysActive} total days active on this plan</p>
              </TooltipContent>
            </Tooltip>
            {isWorkout && plan.workout_template && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">{plan.workout_template.days_per_week}d/wk</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This program has {plan.workout_template.days_per_week} workout days per week</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {/* Progress bar for programs with duration */}
          {totalDuration && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{totalDuration}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          
          {/* Macro progress for diet plans */}
          {!isWorkout && dietPlan && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">Today's Progress</p>
              <div className="grid grid-cols-4 gap-1.5">
                <MacroMiniProgress
                  icon={<Flame className="w-3 h-3 text-orange-500" />}
                  label="Cal"
                  value={todaysTotals.calories}
                  target={dietPlan.calories_target}
                />
                <MacroMiniProgress
                  icon={<Beef className="w-3 h-3 text-red-500" />}
                  label="P"
                  value={todaysTotals.protein}
                  target={dietPlan.protein_grams}
                  unit="g"
                />
                <MacroMiniProgress
                  icon={<Wheat className="w-3 h-3 text-amber-500" />}
                  label="C"
                  value={todaysTotals.carbs}
                  target={dietPlan.carbs_grams}
                  unit="g"
                />
                <MacroMiniProgress
                  icon={<Droplet className="w-3 h-3 text-yellow-500" />}
                  label="F"
                  value={todaysTotals.fat}
                  target={dietPlan.fat_grams}
                  unit="g"
                />
              </div>
              {/* Meal suggestion based on remaining macros */}
              {dietPlan.calories_target && todaysTotals.calories < dietPlan.calories_target && (
                <div className="text-xs bg-muted/50 rounded p-2 mt-2">
                  <span className="text-muted-foreground">Remaining: </span>
                  <span className="font-medium">
                    {Math.round(dietPlan.calories_target - todaysTotals.calories)} kcal
                  </span>
                  {dietPlan.protein_grams && (
                    <span className="text-muted-foreground">
                      {" "}• {Math.max(0, Math.round(dietPlan.protein_grams - todaysTotals.protein))}g P
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons with tooltips */}
          <div className="flex gap-2 pt-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8 text-xs" 
              onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs px-2" 
                  onClick={(e) => { e.stopPropagation(); onPause(); }} 
                  disabled={isPending}
                >
                  <PauseCircle className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pause this plan temporarily</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs px-2" 
                  onClick={(e) => { e.stopPropagation(); onComplete(); }} 
                  disabled={isPending}
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark this plan as completed</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
      
      {/* Detail Sheets */}
      {isWorkout ? (
        <TemplateDetailSheet
          templateId={plan.workout_template_id}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      ) : (
        <DietPlanDetailSheet
          plan={plan.diet_plan ? {
            ...plan.diet_plan,
            is_system: false,
            is_active: true,
            created_at: plan.created_at,
            updated_at: plan.updated_at,
            created_by: null,
            dietary_type: null,
            goal: null,
            meals_per_day: null,
            notes: null,
          } : null}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </TooltipProvider>
  );
}

function MacroMiniProgress({
  icon,
  label,
  value,
  target,
  unit = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  target: number | null;
  unit?: string;
}) {
  const progress = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const isOver = target && value > target;
  
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-0.5 mb-1">
        {icon}
      </div>
      <div className="text-xs font-medium">
        {Math.round(value)}
        <span className="text-muted-foreground">
          /{target || 0}{unit}
        </span>
      </div>
      <Progress 
        value={progress} 
        className={`h-1 mt-1 ${isOver ? '[&>div]:bg-destructive' : ''}`} 
      />
    </div>
  );
}
