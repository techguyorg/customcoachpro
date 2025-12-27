import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Activity, ClipboardCheck, Dumbbell, Filter, TrendingUp, Users, Utensils } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import analyticsService from "@/services/analyticsService";
import coachService, { CoachClientListItem } from "@/services/coachService";
import { useToast } from "@/components/ui/use-toast";

type RangePreset = { label: string; value: string; days: number };

const RANGE_OPTIONS: RangePreset[] = [
  { label: "Last 7 days", value: "7", days: 7 },
  { label: "Last 30 days", value: "30", days: 30 },
  { label: "Last 90 days", value: "90", days: 90 },
];

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AnalyticsPage() {
  const { toast } = useToast();
  const [range, setRange] = useState<string>("30");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const { data: clients = [] } = useQuery({
    queryKey: ["coach", "clients"],
    queryFn: () => coachService.getClients(),
  });

  const filterParams = useMemo(() => {
    const preset = RANGE_OPTIONS.find((option) => option.value === range);
    const days = preset?.days ?? 30;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      clientKey: selectedClients.slice().sort().join(","),
    };
  }, [range, selectedClients]);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    error: analyticsError,
  } = useQuery({
    queryKey: ["analytics", filterParams.startDate, filterParams.endDate, filterParams.clientKey],
    queryFn: () =>
      analyticsService.getAnalytics({
        startDate: filterParams.startDate,
        endDate: filterParams.endDate,
        clientIds: selectedClients,
      }),
    retry: 1,
  });

  useEffect(() => {
    if (analyticsError instanceof Error) {
      toast({
        title: "Unable to load analytics",
        description: analyticsError.message,
        variant: "destructive",
      });
    }
  }, [analyticsError, toast]);

  const toggleClient = (id: string) => {
    setSelectedClients((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const isLoading = analyticsLoading || analyticsFetching;

  const engagementData = useMemo(
    () =>
      (analytics?.engagement.trend ?? []).map((point) => ({
        ...point,
        label: formatDateLabel(point.date),
      })),
    [analytics]
  );

  const complianceData = useMemo(
    () =>
      (analytics?.compliance.trend ?? []).map((point) => ({
        ...point,
        label: formatDateLabel(point.date),
      })),
    [analytics]
  );

  const weightDistribution = useMemo(
    () =>
      (analytics?.weightChange.distribution ?? []).map((slice) => ({
        ...slice,
        change: Number(slice.change.toFixed(1)),
      })),
    [analytics]
  );

  const workoutTrend = useMemo(
    () =>
      (analytics?.workoutAdherence.trend ?? []).map((point) => ({
        ...point,
        label: formatDateLabel(point.date),
      })),
    [analytics]
  );

  const selectedRangeLabel = RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "Custom";
  const filterBadge =
    selectedClients.length === 0
      ? "All clients"
      : `${selectedClients.length} client${selectedClients.length > 1 ? "s" : ""}`;

  const planSummary = analytics?.planOutcomes;

  const renderLoadingStat = () => <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title="Analytics" description="Track your coaching performance and client outcomes." />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Clients</span>
                <Badge variant="secondary">{filterBadge}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filter clients</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedClients.length === 0}
                onCheckedChange={() => setSelectedClients([])}
              >
                All clients
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {clients.map((client: CoachClientListItem) => (
                <DropdownMenuCheckboxItem
                  key={client.id}
                  checked={selectedClients.includes(client.id)}
                  onCheckedChange={() => toggleClient(client.id)}
                >
                  {client.displayName}
                </DropdownMenuCheckboxItem>
              ))}
              {!clients.length && <DropdownMenuCheckboxItem disabled>No clients available</DropdownMenuCheckboxItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          renderLoadingStat()
        ) : (
          <StatCard
            title="Engaged Clients"
            value={analytics?.engagement.activeClients ?? 0}
            subtitle={`${selectedRangeLabel}`}
            icon={Users}
            variant="primary"
          />
        )}
        {isLoading ? (
          renderLoadingStat()
        ) : (
          <StatCard
            title="Check-ins"
            value={analytics?.engagement.totalCheckIns ?? 0}
            subtitle="Total in range"
            icon={ClipboardCheck}
            variant="secondary"
          />
        )}
        {isLoading ? (
          renderLoadingStat()
        ) : (
          <StatCard
            title="Avg. Compliance"
            value={`${(analytics?.compliance.averageCompliance ?? 0).toFixed(1)}%`}
            subtitle="Diet check-ins"
            icon={TrendingUp}
            variant="accent"
          />
        )}
        {isLoading ? (
          renderLoadingStat()
        ) : (
          <StatCard
            title="Workout Completion"
            value={`${(analytics?.workoutAdherence.completionRate ?? 0).toFixed(1)}%`}
            subtitle={`${analytics?.workoutAdherence.completedWorkouts ?? 0} of ${
              analytics?.workoutAdherence.totalWorkoutCheckIns ?? 0
            } completed`}
            icon={Activity}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Engagement</CardTitle>
            <CardDescription>Check-in activity in the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : engagementData.length ? (
              <ChartContainer
                config={{
                  total: { label: "Total", color: "hsl(var(--primary))" },
                  weight: { label: "Weight", color: "hsl(var(--secondary))" },
                  workout: { label: "Workout", color: "hsl(var(--accent))" },
                  diet: { label: "Diet", color: "hsl(var(--destructive))" },
                  photos: { label: "Photos", color: "hsl(var(--muted-foreground))" },
                }}
                className="h-[280px]"
              >
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickMargin={8} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line dataKey="total" type="monotone" stroke="var(--color-total)" strokeWidth={2} dot={false} />
                  <Line dataKey="weight" type="monotone" stroke="var(--color-weight)" strokeWidth={1.5} dot={false} />
                  <Line
                    dataKey="workout"
                    type="monotone"
                    stroke="var(--color-workout)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line dataKey="diet" type="monotone" stroke="var(--color-diet)" strokeWidth={1.5} dot={false} />
                  <Line dataKey="photos" type="monotone" stroke="var(--color-photos)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No engagement data for this range.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Diet Compliance</CardTitle>
            <CardDescription>Average compliance rating (0-100%)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : complianceData.length ? (
              <ChartContainer
                config={{
                  average: { label: "Average compliance", color: "hsl(var(--accent))" },
                }}
                className="h-[280px]"
              >
                <LineChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickMargin={8} />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="average"
                    type="monotone"
                    stroke="var(--color-average)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No compliance data for this range.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weight Change Distribution</CardTitle>
            <CardDescription>Start vs. latest weight per client</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : weightDistribution.length ? (
              <ChartContainer
                config={{
                  change: { label: "Change", color: "hsl(var(--primary))" },
                }}
                className="h-[260px]"
              >
                <BarChart data={weightDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="clientName" tickMargin={8} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="change" fill="var(--color-change)" radius={6} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No weight data available for this selection.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workout Adherence</CardTitle>
            <CardDescription>Completion rate from workout check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : workoutTrend.length ? (
              <ChartContainer
                config={{
                  completionRate: { label: "Completion rate", color: "hsl(var(--secondary))" },
                }}
                className="h-[260px]"
              >
                <LineChart data={workoutTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickMargin={8} />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="completionRate"
                    type="monotone"
                    stroke="var(--color-completionRate)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No workout adherence data for this range.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-secondary" />
              Workout Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active assignments</span>
                  <span className="font-bold">{planSummary?.workoutPlans.active ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-foreground">{planSummary?.workoutPlans.completed ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total overlapping</span>
                  <span className="font-bold text-vitality">{planSummary?.workoutPlans.total ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5 text-accent" />
              Diet Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active assignments</span>
                  <span className="font-bold">{planSummary?.dietPlans.active ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-foreground">{planSummary?.dietPlans.completed ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total overlapping</span>
                  <span className="font-bold text-vitality">{planSummary?.dietPlans.total ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
