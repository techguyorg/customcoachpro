import { TrendingUp, Users, ClipboardCheck, Dumbbell, Utensils } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';

// Mock data
const mockStats = {
  totalClients: 24,
  activeClients: 18,
  checkInsThisMonth: 156,
  avgCompliance: 87,
  workoutPlans: 15,
  dietPlans: 12,
};

export function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Track your coaching performance and client progress"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Clients"
          value={mockStats.totalClients}
          subtitle={`${mockStats.activeClients} currently active`}
          icon={Users}
          variant="primary"
          iconTone="brand"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Check-ins This Month"
          value={mockStats.checkInsThisMonth}
          subtitle="Across all clients"
          icon={ClipboardCheck}
          variant="secondary"
          iconTone="warning"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Avg. Compliance Rate"
          value={`${mockStats.avgCompliance}%`}
          subtitle="Diet & workout combined"
          icon={TrendingUp}
          variant="accent"
          iconTone="analytics"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Activity</CardTitle>
            <CardDescription>Check-in activity over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Chart placeholder - integrate with recharts</p>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Trends</CardTitle>
            <CardDescription>Diet and workout compliance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Chart placeholder - integrate with recharts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Usage */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-icon-workout" />
              Workout Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Plans Created</span>
                <span className="font-bold">{mockStats.workoutPlans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Currently Assigned</span>
                <span className="font-bold">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. Completion Rate</span>
                <span className="font-bold text-icon-success">92%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5 text-icon-diet" />
              Diet Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Plans Created</span>
                <span className="font-bold">{mockStats.dietPlans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Currently Assigned</span>
                <span className="font-bold">16</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. Compliance Rate</span>
                <span className="font-bold text-icon-success">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
