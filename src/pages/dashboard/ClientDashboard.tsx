import { Scale, TrendingUp, Dumbbell, Utensils, Calendar, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import dashboardService from "@/services/dashboardService";

export function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard", "client"],
    queryFn: () => dashboardService.getClientStats(),
  });

  const name = user?.displayName || user?.firstName || "there";

  // Keep demo widgets below for now; stats cards are real.
  const mockTodayWorkout = {
    name: "Upper Body Strength",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8-10" },
      { name: "Overhead Press", sets: 3, reps: "10-12" },
      { name: "Bent Over Rows", sets: 4, reps: "8-10" },
      { name: "Tricep Dips", sets: 3, reps: "12-15" },
    ],
  };

  const mockTodayMeals = [
    { name: "Breakfast", time: "7:00 AM", calories: 450, status: "completed" },
    { name: "Snack", time: "10:00 AM", calories: 200, status: "completed" },
    { name: "Lunch", time: "12:30 PM", calories: 650, status: "upcoming" },
    { name: "Dinner", time: "7:00 PM", calories: 700, status: "upcoming" },
  ];

  const mockWeeklyProgress = [
    { day: "Mon", completed: true },
    { day: "Tue", completed: true },
    { day: "Wed", completed: true },
    { day: "Thu", completed: false },
    { day: "Fri", completed: false },
    { day: "Sat", completed: false },
    { day: "Sun", completed: false },
  ];

  const weightChangeAbs = Math.abs(stats?.weightChange ?? 0);
  const weightChangePositive = (stats?.weightChange ?? 0) < 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Hey, ${name}! 💪`}
        description="Let's crush your goals today."
        actions={
          <Button onClick={() => navigate("/check-in")} className="shadow-energy">
            Log Check-in
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Weight"
          value={`${stats?.currentWeight ?? 0} lbs`}
          icon={Scale}
          variant="primary"
          trend={{ value: weightChangeAbs, isPositive: weightChangePositive }}
        />
        <StatCard
          title="Workouts Completed"
          value={stats?.workoutsCompleted ?? 0}
          subtitle="This month"
          icon={Dumbbell}
          variant="secondary"
        />
        <StatCard
          title="Diet Compliance"
          value={`${stats?.dietComplianceAverage ?? 0}%`}
          subtitle="Average"
          icon={Utensils}
          variant="accent"
        />
        <StatCard
          title="Days on Plan"
          value={stats?.daysOnPlan ?? 0}
          subtitle="Keep it up!"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-secondary" />
                Today's Workout
              </CardTitle>
              <CardDescription>{mockTodayWorkout.name}</CardDescription>
            </div>
            <Button size="sm" onClick={() => navigate("/my-plan")}>
              Start Workout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTodayWorkout.exercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {exercise.sets} × {exercise.reps}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-accent" />
                Today's Meals
              </CardTitle>
              <CardDescription>Target: coming in Sprint 3</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/my-plan")}>
              View Plan
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTodayMeals.map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {meal.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-vitality" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-sm text-muted-foreground">{meal.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{meal.calories} cal</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            This Week's Progress
          </CardTitle>
          <CardDescription>Streak system comes later</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            {mockWeeklyProgress.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    day.completed ? "bg-vitality text-vitality-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day.completed ? <CheckCircle2 className="h-6 w-6" /> : <span className="text-sm font-medium">{day.day}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Weekly Goal Progress</span>
              <span className="font-medium">3/5 workouts</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientDashboard;
