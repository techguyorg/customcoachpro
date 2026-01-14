import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Plus, 
  Calendar, 
  Clock, 
  Dumbbell,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Flame,
  BarChart3
} from "lucide-react";
import { useWorkoutLogs, useWorkoutStats } from "@/hooks/useWorkoutLogs";
import { useWorkoutAnalytics } from "@/hooks/useWorkoutAnalytics";
import { useActiveAssignments } from "@/hooks/usePlanAssignments";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { StartWorkoutDialog } from "@/components/workout/StartWorkoutDialog";
import { WorkoutLogCard } from "@/components/workout/WorkoutLogCard";
import { WorkoutCalendar } from "@/components/client/WorkoutCalendar";
import { WorkoutAnalyticsSection } from "@/components/workout/WorkoutAnalyticsSection";

export default function WorkoutsPage() {
  const { data: workoutLogs, isLoading: logsLoading } = useWorkoutLogs();
  const { data: stats, isLoading: statsLoading } = useWorkoutStats();
  const activeAssignments = useActiveAssignments();
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  const activeWorkoutPlan = activeAssignments?.find(a => a.plan_type === "workout");
  const completedWorkouts = workoutLogs?.filter(w => w.status === "completed") || [];
  const inProgressWorkout = workoutLogs?.find(w => w.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Workouts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your training sessions and progress
          </p>
        </div>
        <Button onClick={() => setStartDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Start Workout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats?.workoutsThisWeek || 0}</p>
                <p className="text-xs text-muted-foreground">workouts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats?.totalMinutesThisWeek || 0}</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats?.currentStreak || 0}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <Dumbbell className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats?.totalWorkouts || 0}</p>
                <p className="text-xs text-muted-foreground">workouts</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* In Progress Workout */}
      {inProgressWorkout && (
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Workout In Progress
              </CardTitle>
              <Link to={`/client/workouts/${inProgressWorkout.id}`}>
                <Button size="sm">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Started {inProgressWorkout.started_at ? format(new Date(inProgressWorkout.started_at), "h:mm a") : "recently"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Program */}
      {activeWorkoutPlan && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Program</CardTitle>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activeWorkoutPlan.workout_template?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activeWorkoutPlan.workout_template?.days_per_week} days/week
                  {activeWorkoutPlan.workout_template?.duration_weeks && 
                    ` • ${activeWorkoutPlan.workout_template.duration_weeks} weeks`}
                </p>
              </div>
              <Link to="/client/programs">
                <Button variant="outline" size="sm">
                  View Program
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout History */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          {logsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : completedWorkouts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No workouts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first workout to begin tracking your progress
                </p>
                <Button onClick={() => setStartDialogOpen(true)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start First Workout
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedWorkouts.map(log => (
                <WorkoutLogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <WorkoutCalendar />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <WorkoutAnalyticsSection />
        </TabsContent>
      </Tabs>

      {/* Start Workout Dialog */}
      <StartWorkoutDialog 
        open={startDialogOpen} 
        onOpenChange={setStartDialogOpen} 
      />
    </div>
  );
}
