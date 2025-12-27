import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Dumbbell, Utensils, Calendar, Target } from 'lucide-react';
import clientPortalService from '@/services/clientPortalService';

export function MyPlanPage() {
  const { user } = useAuth();
  const clientId = user?.id;

  const {
    data: workoutPlan,
    isLoading: isLoadingWorkout,
  } = useQuery({
    queryKey: ['client', 'workout-plan', clientId],
    queryFn: () => clientPortalService.getAssignedWorkoutPlan(clientId ?? ''),
    enabled: !!clientId,
  });

  const {
    data: dietPlan,
    isLoading: isLoadingDiet,
  } = useQuery({
    queryKey: ['client', 'diet-plan', clientId],
    queryFn: () => clientPortalService.getAssignedDietPlan(clientId ?? ''),
    enabled: !!clientId,
  });

  const activeWorkoutDayNames = useMemo(
    () => workoutPlan?.plan?.days?.map((day) => day.name || `Day ${day.dayNumber}`) ?? [],
    [workoutPlan?.plan?.days],
  );

  const activeDietDay = useMemo(
    () => dietPlan?.plan?.days?.[0],
    [dietPlan?.plan?.days],
  );

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString() : 'Not scheduled';

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Plan"
        description="View your assigned workout and diet plans"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Workout Plan</CardTitle>
                <CardDescription>Your current training program</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingWorkout ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : workoutPlan?.plan ? (
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{workoutPlan.plan.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {workoutPlan.plan.durationWeeks} week program
                    </p>
                  </div>
                  <Badge variant="secondary">{workoutPlan.assignment?.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                {workoutPlan.plan.description && (
                  <p className="text-sm text-muted-foreground">{workoutPlan.plan.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {activeWorkoutDayNames.map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {workoutPlan.plan.days.map((day) => (
                    <div key={day.id} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm font-semibold">{day.name || `Day ${day.dayNumber}`}</p>
                      <p className="text-xs text-muted-foreground">{day.exercises.length} exercises</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Start date: {formatDate(workoutPlan.assignment?.startDate)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                No workout plan assigned yet. Your coach will add one soon.
              </div>
            )}
            <Button className="w-full" variant="outline">
              View Plan Details
            </Button>
          </CardContent>
        </Card>

        <Card className="border-energy/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-energy/10">
                <Utensils className="h-5 w-5 text-energy" />
              </div>
              <div>
                <CardTitle className="text-lg">Diet Plan</CardTitle>
                <CardDescription>Your nutrition program</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingDiet ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : dietPlan?.plan ? (
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{dietPlan.plan.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dietPlan.plan.days.length} day rotation
                    </p>
                  </div>
                  <Badge className="bg-energy/10 text-energy" variant="secondary">
                    {dietPlan.assignment?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {dietPlan.plan.description && (
                  <p className="text-sm text-muted-foreground">{dietPlan.plan.description}</p>
                )}
                {activeDietDay ? (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{activeDietDay.targetCalories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm font-semibold text-primary">{activeDietDay.targetProtein}g</p>
                        <p className="text-[11px] text-muted-foreground">Protein</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-energy">{activeDietDay.targetCarbs}g</p>
                        <p className="text-[11px] text-muted-foreground">Carbs</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-warning">{activeDietDay.targetFat}g</p>
                        <p className="text-[11px] text-muted-foreground">Fat</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No meals configured yet.</p>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Meals</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {dietPlan.plan.days.flatMap((day) =>
                      day.meals.map((meal) => (
                        <div key={meal.id} className="rounded-lg border border-border/50 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{meal.meal?.name ?? 'Meal'}</span>
                            <span className="text-xs text-muted-foreground">{meal.mealTime}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Day {day.dayNumber}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Started: {formatDate(dietPlan.assignment?.startDate)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                No diet plan assigned yet. Your coach will add one soon.
              </div>
            )}
            <Button variant="secondary" className="w-full">
              View Meal Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>This Week&apos;s Schedule</CardTitle>
          </div>
          <CardDescription>Workouts from your assigned plan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWorkout ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : activeWorkoutDayNames.length ? (
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayLabel, index) => {
                const plannedDay = activeWorkoutDayNames[index];
                return (
                  <div
                    key={dayLabel}
                    className={`rounded-lg p-3 text-center border ${
                      plannedDay ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-muted'
                    }`}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{dayLabel}</p>
                    <p className="text-sm font-semibold mt-1 truncate">
                      {plannedDay ?? 'Rest'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No weekly schedule available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MyPlanPage;
