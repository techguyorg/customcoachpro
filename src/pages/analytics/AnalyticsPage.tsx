import { Activity, BarChart3, Dumbbell, LineChart, Scale, Utensils } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mockStats = {
  clients: { total: 26, active: 18 },
  workout: { plans: 32, adherence: 0.87 },
  diet: { plans: 28, compliance: 0.82 },
  weight: { avgChange: -6.4, checkIns: 142 },
};

export function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Analytics" description="High-level insights across clients, workouts, and nutrition." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Clients"
          value={`${mockStats.clients.active}/${mockStats.clients.total}`}
          icon={Activity}
          badge="Engagement"
        />
        <StatCard
          title="Workout Adherence"
          value={`${Math.round(mockStats.workout.adherence * 100)}%`}
          subtitle={`${mockStats.workout.plans} plans in use`}
          icon={Dumbbell}
          badge="Training"
        />
        <StatCard
          title="Diet Compliance"
          value={`${Math.round(mockStats.diet.compliance * 100)}%`}
          subtitle={`${mockStats.diet.plans} plans in use`}
          icon={Utensils}
          badge="Nutrition"
        />
        <StatCard
          title="Avg. Weight Change"
          value={`${mockStats.weight.avgChange} lbs`}
          subtitle={`${mockStats.weight.checkIns} check-ins`}
          icon={Scale}
          badge="Progress"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Trends snapshot
            </CardTitle>
            <CardDescription>Placeholder until real analytics endpoints are wired.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Replace mock data with API-driven metrics (weight trends, adherence, compliance).</p>
            <p>• Add filters by date range, client, and program.</p>
            <p>• Visualize at-risk clients and highlight top performers.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Data completeness
            </CardTitle>
            <CardDescription>Highlight where data is missing or stale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Pending check-ins and overdue updates.</p>
            <p>• Clients without active workout/diet plans.</p>
            <p>• Last activity and engagement streaks.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {badge && (
            <Badge variant="outline" className="mt-2">
              {badge}
            </Badge>
          )}
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground">Replace with live metrics once analytics endpoints are available.</p>
      </CardContent>
    </Card>
  );
}

export default AnalyticsPage;
