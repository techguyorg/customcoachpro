import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, startOfWeek } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { TrendingDown, TrendingUp, Target, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import clientPortalService from '@/services/clientPortalService';

export function ProgressPage() {
  const { user } = useAuth();

  const {
    data: checkIns = [],
    isLoading,
  } = useQuery({
    queryKey: ['check-ins', 'client'],
    queryFn: () => clientPortalService.getCheckIns(),
  });

  const weightEntries = useMemo(
    () =>
      checkIns
        .filter((checkIn) => checkIn.type === 'weight' && checkIn.data.weight)
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
        .map((checkIn) => ({
          submittedAt: checkIn.submittedAt,
          weight: Number(checkIn.data.weight),
          bodyFat: checkIn.data.bodyFat,
        })),
    [checkIns],
  );

  const workoutEntries = useMemo(() => checkIns.filter((checkIn) => checkIn.type === 'workout'), [checkIns]);
  const dietEntries = useMemo(() => checkIns.filter((checkIn) => checkIn.type === 'diet'), [checkIns]);

  const currentWeight = weightEntries.at(-1)?.weight ?? 0;
  const startWeight = weightEntries[0]?.weight ?? currentWeight;
  const targetWeight = user?.targetWeight ?? startWeight;
  const weightLost = startWeight && currentWeight ? startWeight - currentWeight : 0;
  const percentToGoal = startWeight && targetWeight && startWeight !== targetWeight
    ? Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100))
    : 0;

  const workoutsCompleted = workoutEntries.filter((entry) => entry.data.completed).length;
  const workoutCompletionRate = workoutEntries.length
    ? Math.round((workoutsCompleted / workoutEntries.length) * 100)
    : 0;

  const dietAverage = dietEntries.length
    ? Number(
        (
          dietEntries.reduce((total, entry) => total + (entry.data.complianceRating ?? 0), 0) /
          dietEntries.length
        ).toFixed(1)
      )
    : 0;

  const daysOnPlan = weightEntries.length
    ? differenceInDays(new Date(), new Date(weightEntries[0].submittedAt)) + 1
    : 0;

  const weightData = weightEntries.map((entry) => ({
    date: format(new Date(entry.submittedAt), 'MMM d'),
    weight: entry.weight,
    target: targetWeight,
  }));

  const workoutTrend = useMemo(() => {
    const weekly = new Map<string, { weekStart: Date; completed: number; total: number }>();

    workoutEntries.forEach((entry) => {
      const weekStart = startOfWeek(new Date(entry.submittedAt), { weekStartsOn: 1 });
      const key = weekStart.toISOString();
      const current = weekly.get(key) ?? { weekStart, completed: 0, total: 0 };
      weekly.set(key, {
        weekStart,
        total: current.total + 1,
        completed: current.completed + (entry.data.completed ? 1 : 0),
      });
    });

    return Array.from(weekly.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .map((item) => ({
        week: format(item.weekStart, 'MMM d'),
        completed: item.completed,
        planned: item.total,
      }));
  }, [workoutEntries]);

  const dietTrend = useMemo(() =>
    dietEntries
      .filter((entry) => entry.data.complianceRating !== undefined)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .map((entry) => ({
        day: format(new Date(entry.submittedAt), 'EEE'),
        adherence: entry.data.complianceRating ?? 0,
      }))
      .slice(-7),
  [dietEntries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress"
        description="Track your fitness journey and achievements"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
              <TrendingDown className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentWeight ? `${currentWeight.toFixed(1)} kg` : '—'}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{weightLost.toFixed(1)} kg</span> from start
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{percentToGoal.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                {targetWeight ? `${(currentWeight - targetWeight).toFixed(1)} kg to goal` : 'Update your target weight'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts Completed</CardTitle>
              <Activity className="h-4 w-4 text-energy" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workoutEntries.length ? `${workoutsCompleted}/${workoutEntries.length}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground">
                {workoutEntries.length ? `${workoutCompletionRate}% completion rate` : 'Log your first workout check-in'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diet Adherence</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dietAverage || '—'}/10</div>
              <p className="text-xs text-muted-foreground">
                Average this week
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
          <CardDescription>Your weight over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : weightData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${value} kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    fill="url(#weightGradient)"
                    strokeWidth={2}
                  />
                  {targetWeight ? (
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--success))"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No weight check-ins yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workout Completion</CardTitle>
            <CardDescription>Weekly workout adherence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : workoutTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 'dataMax + 1']} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" name="Logged" />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No workout check-ins logged.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diet Adherence</CardTitle>
            <CardDescription>Daily diet compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : dietTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dietTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="hsl(var(--energy))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--energy))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No diet check-ins yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>Milestones you&apos;ve reached</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[{
                title: 'Days on plan',
                description: `${daysOnPlan} days since first check-in`,
                icon: '📅',
              }, {
                title: 'Consistent workouts',
                description: `${workoutsCompleted} completed workouts logged`,
                icon: '💪',
              }, {
                title: 'Diet adherence',
                description: `${dietAverage}/10 average adherence`,
                icon: '🥗',
              }].map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressPage;
