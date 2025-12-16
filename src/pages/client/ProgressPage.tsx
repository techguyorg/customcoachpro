import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { TrendingDown, TrendingUp, Target, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const weightData = [
  { date: 'Week 1', weight: 70.0, target: 60 },
  { date: 'Week 2', weight: 69.5, target: 60 },
  { date: 'Week 3', weight: 69.0, target: 60 },
  { date: 'Week 4', weight: 68.3, target: 60 },
  { date: 'Week 5', weight: 67.8, target: 60 },
];

const workoutData = [
  { week: 'W1', completed: 2, planned: 3 },
  { week: 'W2', completed: 3, planned: 3 },
  { week: 'W3', completed: 3, planned: 3 },
  { week: 'W4', completed: 2, planned: 3 },
  { week: 'W5', completed: 3, planned: 3 },
];

const dietData = [
  { day: 'Mon', adherence: 8 },
  { day: 'Tue', adherence: 9 },
  { day: 'Wed', adherence: 7 },
  { day: 'Thu', adherence: 9 },
  { day: 'Fri', adherence: 8 },
  { day: 'Sat', adherence: 6 },
  { day: 'Sun', adherence: 8 },
];

export function ProgressPage() {
  const weightLost = 70.0 - 67.8;
  const percentToGoal = ((70.0 - 67.8) / (70.0 - 60.0)) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress"
        description="Track your fitness journey and achievements"
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <TrendingDown className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67.8 kg</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">-2.2 kg</span> from start
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
              {(60 - 67.8).toFixed(1)} kg to goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts Completed</CardTitle>
            <Activity className="h-4 w-4 text-energy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13/15</div>
            <p className="text-xs text-muted-foreground">
              87% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diet Adherence</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.9/10</div>
            <p className="text-xs text-muted-foreground">
              Average this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
          <CardDescription>Your weight over the past 5 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
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
                  domain={[55, 75]} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value} kg`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#weightGradient)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--success))" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workout Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Completion</CardTitle>
            <CardDescription>Weekly workout adherence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workoutData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 4]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Diet Adherence */}
        <Card>
          <CardHeader>
            <CardTitle>Diet Adherence</CardTitle>
            <CardDescription>Daily diet compliance this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dietData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>Milestones you've reached</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'First Week Complete', description: 'Finished your first week of training', icon: '🏆' },
              { title: '2kg Lost', description: 'Lost your first 2 kilograms', icon: '📉' },
              { title: 'Perfect Week', description: 'Completed all workouts in a week', icon: '⭐' },
              { title: 'Diet Streak', description: '5 days of 8+ adherence', icon: '🥗' },
            ].map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressPage;
