import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkoutAnalytics } from "@/hooks/useWorkoutAnalytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  Calendar,
  Dumbbell,
  Target
} from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

export function WorkoutAnalyticsSection() {
  const { data: analytics, isLoading } = useWorkoutAnalytics(90);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No workout data yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete some workouts to see your analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  const { progressMetrics, weeklyVolume, weeklyFrequency, muscleDistribution } = analytics;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{progressMetrics.currentStreak}</p>
            <p className="text-xs text-muted-foreground">
              Best: {progressMetrics.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Avg Duration</p>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-1">{progressMetrics.avgWorkoutDuration}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Exercises/Workout</p>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{progressMetrics.avgExercisesPerWorkout}</p>
            <p className="text-xs text-muted-foreground">average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Most Active Day</p>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold mt-1 truncate">{progressMetrics.mostActiveDay}</p>
            <p className="text-xs text-muted-foreground">{progressMetrics.totalWorkouts} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Frequency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Workout Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyFrequency}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="workouts" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Workouts"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              Training Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyVolume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalSets" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    name="Total Sets"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Muscle Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Muscle Group Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {muscleDistribution.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={muscleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="muscle"
                    >
                      {muscleDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-2">
                {muscleDistribution.map((item, index) => (
                  <div key={item.muscle} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm capitalize truncate">
                      {item.muscle}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No muscle data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
