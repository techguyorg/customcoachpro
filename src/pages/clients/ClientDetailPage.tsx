import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Target,
  Scale,
  TrendingDown,
  Edit,
  Ruler,
  Dumbbell,
  Utensils,
  Camera,
  Pin,
  AlertTriangle,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import coachService from "@/services/coachService";
import workoutPlanService from "@/services/workoutPlanService";
import dietPlanService from "@/services/dietPlanService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts";
import checkInService, { CheckIn, CheckInType } from "@/services/checkInService";
import notificationService, { RenewalNotificationPreferences } from "@/services/notificationService";
import clientNotesService from "@/services/clientNotesService";
import { formatDistanceToNow, differenceInDays, subDays } from "date-fns";

type UnitSystem = "imperial" | "metric";

const INCH_TO_CM = 2.54;
const LB_TO_KG = 0.45359237;

const convertWeight = (value: number | undefined, from: UnitSystem, to: UnitSystem) => {
  if (value === undefined || Number.isNaN(value)) return 0;
  if (from === to) return value;
  return from === "imperial" ? Number((value * LB_TO_KG).toFixed(1)) : Number((value / LB_TO_KG).toFixed(1));
};

const convertLength = (value: number | undefined, to: UnitSystem) => {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return to === "imperial" ? Number((value / INCH_TO_CM).toFixed(1)) : Number(value.toFixed(1));
};

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState("");
  const [workoutStartDate, setWorkoutStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [selectedDietPlan, setSelectedDietPlan] = useState("");
  const [dietStartDate, setDietStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dietDuration, setDietDuration] = useState("");
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [noteAttention, setNoteAttention] = useState(false);

  const clientId = id ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["coach", "client", clientId],
    queryFn: () => coachService.getClient(clientId),
    enabled: !!clientId,
  });

  const { data: workoutPlans = [] } = useQuery({
    queryKey: ["workout-plans"],
    queryFn: () => workoutPlanService.list(),
  });

  const { data: dietPlans = [] } = useQuery({
    queryKey: ["diet-plans"],
    queryFn: () => dietPlanService.list(),
  });

  const { data: workoutAssignments = [], isLoading: isLoadingWorkoutAssignments } = useQuery({
    queryKey: ["client", clientId, "workout-assignments"],
    queryFn: () => workoutPlanService.listForClient(clientId),
    enabled: !!clientId,
  });

  const { data: dietAssignments = [], isLoading: isLoadingDietAssignments } = useQuery({
    queryKey: ["client", clientId, "diet-assignments"],
    queryFn: () => dietPlanService.listForClient(clientId),
    enabled: !!clientId,
  });

  const { data: checkIns = [], isLoading: isLoadingCheckIns } = useQuery({
    queryKey: ["client", clientId, "check-ins"],
    queryFn: () =>
      checkInService.getCheckIns({
        clientId,
        sortBy: "submittedAt",
        sortDirection: "desc",
      }),
    enabled: !!clientId,
  });

  const { data: renewalPreferences, isLoading: isLoadingRenewals } = useQuery({
    queryKey: ["client", clientId, "renewals"],
    queryFn: () => notificationService.getRenewalPreferences(clientId),
    enabled: !!clientId,
  });

  const { data: clientNotes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["client", clientId, "notes"],
    queryFn: () => clientNotesService.list(clientId),
    enabled: !!clientId,
  });

  const assignWorkoutMutation = useMutation({
    mutationFn: () =>
      workoutPlanService.assign({
        clientId,
        workoutPlanId: selectedWorkoutPlan,
        startDate: new Date(workoutStartDate).toISOString(),
        durationDays: workoutDuration ? Number(workoutDuration) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Workout plan assigned" });
      queryClient.invalidateQueries({ queryKey: ["client", clientId, "workout-assignments"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to assign workout plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignDietMutation = useMutation({
    mutationFn: () =>
      dietPlanService.assign({
        clientId,
        dietPlanId: selectedDietPlan,
        startDate: new Date(dietStartDate).toISOString(),
        durationDays: dietDuration ? Number(dietDuration) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Diet plan assigned" });
      queryClient.invalidateQueries({ queryKey: ["client", clientId, "diet-assignments"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to assign diet plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const renewalMutation = useMutation({
    mutationFn: (updates: Partial<RenewalNotificationPreferences>) =>
      notificationService.updateRenewalPreferences({
        clientId,
        workoutRenewal: updates.workoutRenewal ?? renewalPreferences?.workoutRenewal ?? false,
        dietRenewal: updates.dietRenewal ?? renewalPreferences?.dietRenewal ?? false,
      }),
    onSuccess: () => {
      toast({ title: "Renewal notifications updated" });
      queryClient.invalidateQueries({ queryKey: ["client", clientId, "renewals"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to update renewal notifications",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: () =>
      clientNotesService.create(clientId, {
        content: noteContent.trim(),
        pinned: notePinned,
        needsAttention: noteAttention,
      }),
    onSuccess: () => {
      setNoteContent("");
      setNotePinned(false);
      setNoteAttention(false);
      toast({ title: "Note added" });
      queryClient.invalidateQueries({ queryKey: ["client", clientId, "notes"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to add note",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Partial<{ pinned: boolean; needsAttention: boolean }> }) =>
      clientNotesService.update(clientId, noteId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId, "notes"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to update note",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (data?.profile?.preferredUnitSystem === "metric") {
      setUnitSystem("metric");
    }
  }, [data?.profile?.preferredUnitSystem]);

  const weightUnit = useMemo(() => (unitSystem === "imperial" ? "lbs" : "kg"), [unitSystem]);
  const lengthUnit = useMemo(() => (unitSystem === "imperial" ? "in" : "cm"), [unitSystem]);

  const profile = data?.profile;
  const displayName = profile?.displayName || data?.email || "Client";

  const storedWeightUnit = (profile?.preferredUnitSystem as UnitSystem | undefined) ?? "imperial";
  const currentWeight = convertWeight(profile?.currentWeight ?? undefined, storedWeightUnit, unitSystem);
  const startWeight = convertWeight(
    profile?.startWeight ?? profile?.currentWeight ?? undefined,
    storedWeightUnit,
    unitSystem,
  );
  const targetWeight = convertWeight(profile?.targetWeight ?? undefined, storedWeightUnit, unitSystem);

  const height = convertLength(profile?.heightCm ?? undefined, unitSystem);
  const neck = convertLength(profile?.neckCm ?? undefined, unitSystem);
  const arms = convertLength(profile?.armsCm ?? undefined, unitSystem);
  const quads = convertLength(profile?.quadsCm ?? undefined, unitSystem);
  const hips = convertLength(profile?.hipsCm ?? undefined, unitSystem);

  const weightLost = Math.max(0, startWeight - currentWeight);
  const totalToLose = Math.max(0, startWeight - targetWeight);
  const progressPercentage = totalToLose > 0 ? Math.round((weightLost / totalToLose) * 100) : 0;

  const activeWorkoutAssignment = workoutAssignments.find((a) => a.isActive) ?? workoutAssignments[0];
  const activeDietAssignment = dietAssignments.find((a) => a.isActive) ?? dietAssignments[0];

  const assignedWorkoutPlan =
    activeWorkoutAssignment?.workoutPlan ||
    workoutPlans.find((plan) => plan.id === activeWorkoutAssignment?.workoutPlanId);
  const assignedDietPlan =
    activeDietAssignment?.dietPlan || dietPlans.find((plan) => plan.id === activeDietAssignment?.dietPlanId);

  const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "Not set");
  const resolveEndDate = (startDate?: string | null, endDate?: string | null, durationDays?: number | null) => {
    if (endDate) return endDate;
    if (startDate && durationDays) {
      const start = new Date(startDate);
      const computed = new Date(start);
      computed.setDate(computed.getDate() + durationDays);
      return computed.toISOString();
    }
    return undefined;
  };

  const daysToRenewal = (startDate?: string | null, endDate?: string | null, durationDays?: number | null) => {
    const resolved = resolveEndDate(startDate, endDate, durationDays);
    if (!resolved) return null;
    return Math.max(0, differenceInDays(new Date(resolved), new Date()));
  };

  const groupedCheckIns = useMemo(() => {
    const grouped: Record<CheckInType, CheckIn[]> = {
      weight: [],
      diet: [],
      workout: [],
      photos: [],
    };

    (checkIns ?? []).forEach((checkIn) => {
      grouped[checkIn.type]?.push(checkIn);
    });

    (Object.keys(grouped) as CheckInType[]).forEach((type) =>
      grouped[type].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    );

    return grouped;
  }, [checkIns]);

  const weightTrendDelta = useMemo(() => {
    const weights = groupedCheckIns.weight;
    if (!weights.length) return null;

    const latest = weights[0];
    const lastWeekDate = subDays(new Date(latest.submittedAt), 7);
    const comparison = weights.find((check) => new Date(check.submittedAt) <= lastWeekDate);

    if (!latest.data.weight || !comparison?.data.weight) return null;

    return (
      convertWeight(latest.data.weight, storedWeightUnit, unitSystem) -
      convertWeight(comparison.data.weight, storedWeightUnit, unitSystem)
    );
  }, [groupedCheckIns.weight, storedWeightUnit, unitSystem]);

  const complianceAverage = useMemo(() => {
    const ratings = groupedCheckIns.diet
      .map((checkIn) => checkIn.data.complianceRating)
      .filter((value): value is number => typeof value === "number");
    if (!ratings.length) return null;
    return Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1));
  }, [groupedCheckIns.diet]);

  const measurementTimeline = useMemo(() => {
    const points = [...groupedCheckIns.weight]
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .map((checkIn) => ({
        date: new Date(checkIn.submittedAt).toLocaleDateString(),
        weight: checkIn.data.weight !== undefined ? convertWeight(checkIn.data.weight, storedWeightUnit, unitSystem) : undefined,
        waist: checkIn.data.waist !== undefined ? convertLength(checkIn.data.waist, unitSystem) : undefined,
        bodyFat: checkIn.data.bodyFat !== undefined ? Number(checkIn.data.bodyFat) : undefined,
      }));

    if (profile.startWeight) {
      points.unshift({
        date: profile.startDate ? new Date(profile.startDate).toLocaleDateString() : "Start",
        weight: convertWeight(profile.startWeight, storedWeightUnit, unitSystem),
        waist: undefined,
        bodyFat: undefined,
      });
    }

    return points;
  }, [groupedCheckIns.weight, profile.startDate, profile.startWeight, storedWeightUnit, unitSystem]);

  const measurementChartConfig = useMemo(
    () => ({
      weight: {
        label: `Weight (${weightUnit})`,
        color: "hsl(var(--primary))",
      },
      waist: {
        label: `Waist (${lengthUnit})`,
        color: "hsl(var(--muted-foreground))",
      },
      bodyFat: {
        label: "Body Fat (%)",
        color: "#f97316",
      },
    }),
    [lengthUnit, weightUnit],
  );

  const orderedNotes = useMemo(
    () =>
      [...clientNotes].sort((a, b) => {
        if (a.pinned === b.pinned) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.pinned ? -1 : 1;
      }),
    [clientNotes],
  );

  const checkInMeta: Record<
    CheckInType,
    {
      label: string;
      icon: typeof Scale;
    }
  > = {
    weight: { label: "Weight & Measurements", icon: Scale },
    diet: { label: "Diet Compliance", icon: Utensils },
    workout: { label: "Workout Completion", icon: Dumbbell },
    photos: { label: "Progress Photos", icon: Camera },
  };

  const formatCheckInSummary = (checkIn: CheckIn) => {
    switch (checkIn.type) {
      case "weight": {
        const weightValue =
          checkIn.data.weight !== undefined
            ? `${convertWeight(checkIn.data.weight, storedWeightUnit, unitSystem)} ${weightUnit}`
            : null;
        const waistValue =
          checkIn.data.waist !== undefined ? `${convertLength(checkIn.data.waist, unitSystem)} ${lengthUnit}` : null;
        const bodyFatValue =
          checkIn.data.bodyFat !== undefined ? `${Number(checkIn.data.bodyFat).toFixed(1)}% bf` : null;

        return ["Weight", weightValue, waistValue, bodyFatValue].filter(Boolean).join(" • ");
      }
      case "diet": {
        const compliance =
          checkIn.data.complianceRating !== undefined ? `Compliance ${checkIn.data.complianceRating}/10` : null;
        const deviations = checkIn.data.deviations ? `Deviations: ${checkIn.data.deviations}` : null;
        return [compliance, deviations].filter(Boolean).join(" • ");
      }
      case "workout": {
        const status = checkIn.data.completed ? "Workout completed" : "Workout not completed";
        return checkIn.data.workoutNotes ? `${status} • ${checkIn.data.workoutNotes}` : status;
      }
      case "photos":
        return "Progress photos submitted";
      default:
        return "";
    }
  };

  const renderCheckInDetails = (checkIn: CheckIn) => {
    switch (checkIn.type) {
      case "weight":
        return (
          <div className="grid grid-cols-2 gap-3">
            {checkIn.data.weight !== undefined && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="text-lg font-semibold">
                  {convertWeight(checkIn.data.weight, storedWeightUnit, unitSystem)} {weightUnit}
                </p>
              </div>
            )}
            {checkIn.data.bodyFat !== undefined && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Body Fat</p>
                <p className="text-lg font-semibold">{Number(checkIn.data.bodyFat).toFixed(1)}%</p>
              </div>
            )}
            {checkIn.data.waist !== undefined && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Waist</p>
                <p className="text-lg font-semibold">
                  {convertLength(checkIn.data.waist, unitSystem)} {lengthUnit}
                </p>
              </div>
            )}
            {checkIn.data.arms !== undefined && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Arms</p>
                <p className="text-lg font-semibold">
                  {convertLength(checkIn.data.arms, unitSystem)} {lengthUnit}
                </p>
              </div>
            )}
          </div>
        );
      case "diet":
        return (
          <div className="space-y-3">
            {checkIn.data.complianceRating !== undefined && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Compliance</p>
                <p className="text-xl font-semibold text-primary">{checkIn.data.complianceRating}/10</p>
              </div>
            )}
            {checkIn.data.deviations && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Deviations</p>
                <p className="text-sm">{checkIn.data.deviations}</p>
              </div>
            )}
          </div>
        );
      case "workout":
        return (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">{checkIn.data.completed ? "Completed" : "Not completed"}</p>
            </div>
            {checkIn.data.workoutNotes && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{checkIn.data.workoutNotes}</p>
              </div>
            )}
          </div>
        );
      case "photos":
        return (
          <div className="grid grid-cols-3 gap-3">
            {["front", "side", "back"].map((angle) => (
              <div key={angle} className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {angle.charAt(0).toUpperCase() + angle.slice(1)} view
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const workoutEndDate = resolveEndDate(
    activeWorkoutAssignment?.startDate,
    activeWorkoutAssignment?.endDate,
    activeWorkoutAssignment?.durationDays,
  );
  const dietEndDate = resolveEndDate(
    activeDietAssignment?.startDate,
    activeDietAssignment?.endDate,
    activeDietAssignment?.durationDays,
  );

  const workoutDaysRemaining = daysToRenewal(
    activeWorkoutAssignment?.startDate,
    activeWorkoutAssignment?.endDate,
    activeWorkoutAssignment?.durationDays,
  );
  const dietDaysRemaining = daysToRenewal(
    activeDietAssignment?.startDate,
    activeDietAssignment?.endDate,
    activeDietAssignment?.durationDays,
  );

  const workoutRenewalEnabled = renewalPreferences?.workoutRenewal ?? false;
  const dietRenewalEnabled = renewalPreferences?.dietRenewal ?? false;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data || !profile) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Client not found</h1>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Unable to load client."}
        </p>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {displayName?.[0]?.toUpperCase() ?? "C"}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-2xl font-display font-bold">{displayName}</h1>
              <p className="text-muted-foreground">{data.email}</p>
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={unitSystem === "imperial" ? "default" : "outline"} onClick={() => setUnitSystem("imperial")}>
          Imperial (lbs/in)
        </Button>
        <Button type="button" variant={unitSystem === "metric" ? "default" : "outline"} onClick={() => setUnitSystem("metric")}>
          Metric (kg/cm)
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-xl font-bold">
                  {currentWeight || 0} {weightUnit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Weight</p>
                <p className="text-xl font-bold">
                  {targetWeight || 0} {weightUnit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-vitality/10">
                <TrendingDown className="h-5 w-5 text-vitality" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight Lost</p>
                <p className="text-xl font-bold">
                  {weightLost} {weightUnit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-xl font-bold">
                  {profile.startDate ? new Date(profile.startDate).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Goal Progress</CardTitle>
          <CardDescription>
            {weightLost} of {totalToLose} {weightUnit} to goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{progressPercentage}% complete</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{profile.bio || "No goals set"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coach Notes</CardTitle>
                <CardDescription>Private notes for this client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="noteContent">Add note</Label>
                  <Textarea
                    id="noteContent"
                    placeholder="Track observations, reminders, or follow-ups..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <Switch checked={notePinned} onCheckedChange={setNotePinned} />
                      Pin note
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch checked={noteAttention} onCheckedChange={setNoteAttention} />
                      Needs Attention
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      className="shadow-energy"
                      onClick={() => createNoteMutation.mutate()}
                      disabled={!noteContent.trim() || createNoteMutation.isPending}
                    >
                      {createNoteMutation.isPending ? "Saving..." : "Add note"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {isLoadingNotes ? (
                    <p className="text-muted-foreground text-sm">Loading notes...</p>
                  ) : orderedNotes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No notes yet. Add your first note above.</p>
                  ) : (
                    orderedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border p-3 bg-muted/40 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {note.pinned && (
                                <Badge variant="secondary" className="gap-1">
                                  <Pin className="h-3 w-3" />
                                  Pinned
                                </Badge>
                              )}
                              {note.needsAttention && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Needs Attention
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{note.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() =>
                                updateNoteMutation.mutate({
                                  noteId: note.id,
                                  updates: { pinned: !note.pinned },
                                })
                              }
                              disabled={updateNoteMutation.isPending}
                            >
                              {note.pinned ? "Unpin" : "Pin"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() =>
                                updateNoteMutation.mutate({
                                  noteId: note.id,
                                  updates: { needsAttention: !note.needsAttention },
                                })
                              }
                              disabled={updateNoteMutation.isPending}
                            >
                              {note.needsAttention ? "Clear flag" : "Flag attention"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Height: {height !== undefined ? `${height} ${lengthUnit}` : "—"}</p>
                <p>Neck: {neck !== undefined ? `${neck} ${lengthUnit}` : "—"}</p>
                <p>Arms: {arms !== undefined ? `${arms} ${lengthUnit}` : "—"}</p>
                <p>Quads: {quads !== undefined ? `${quads} ${lengthUnit}` : "—"}</p>
                <p>Hips: {hips !== undefined ? `${hips} ${lengthUnit}` : "—"}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                {data.email}
              </Button>
              <Badge variant="outline">Assigned</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Check-ins</CardTitle>
                  <CardDescription>Grouped by type with quick context.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    <span>
                      Weight Δ (vs last week):{" "}
                      {weightTrendDelta !== null ? `${weightTrendDelta > 0 ? "+" : ""}${weightTrendDelta.toFixed(1)} ${weightUnit}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-energy" />
                    <span>Avg compliance: {complianceAverage !== null ? `${complianceAverage}/10` : "—"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingCheckIns ? (
                  <p className="text-sm text-muted-foreground">Loading check-ins...</p>
                ) : checkIns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-ins submitted yet.</p>
                ) : (
                  (Object.keys(checkInMeta) as CheckInType[]).map((type) => {
                    const items = groupedCheckIns[type];
                    const Icon = checkInMeta[type].icon;
                    return (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md bg-muted p-2">
                              <Icon className="h-4 w-4" />
                            </div>
                            <p className="font-semibold">{checkInMeta[type].label}</p>
                            <Badge variant="outline">{items.length} total</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Newest first</p>
                        </div>

                        {items.length ? (
                          <div className="space-y-3">
                            {items.slice(0, 6).map((checkIn) => (
                              <div
                                key={checkIn.id}
                                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedCheckIn(checkIn)}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      {new Date(checkIn.submittedAt).toLocaleDateString()} •{" "}
                                      {formatDistanceToNow(new Date(checkIn.submittedAt), { addSuffix: true })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatCheckInSummary(checkIn)}</p>
                                  </div>
                                  <Badge variant={checkIn.status === "reviewed" ? "secondary" : "outline"}>
                                    {checkIn.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground pl-1">No {type} check-ins yet.</p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4 text-primary" />
                  Measurement Trends
                </CardTitle>
                <CardDescription>Weight, waist, and body fat from check-ins.</CardDescription>
              </CardHeader>
              <CardContent>
                {measurementTimeline.length ? (
                  <ChartContainer config={measurementChartConfig} className="min-h-[280px]">
                    <LineChart data={measurementTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--color-weight)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="waist"
                        stroke="var(--color-waist)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="bodyFat"
                        stroke="var(--color-bodyFat)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No measurement data yet. Weight check-ins will appear here.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Workout Plan</CardTitle>
                    <CardDescription>Assign a training program and track it here.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeWorkoutAssignment ? (
                  <div className="rounded-lg border border-primary/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{assignedWorkoutPlan?.name ?? "Assigned plan"}</p>
                        {assignedWorkoutPlan?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{assignedWorkoutPlan.description}</p>
                        )}
                      </div>
                      <Badge variant={activeWorkoutAssignment.isActive ? "secondary" : "outline"}>
                        {activeWorkoutAssignment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {formatDate(activeWorkoutAssignment.startDate)}</span>
                      </div>
                      {activeWorkoutAssignment.durationDays && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>
                            Duration: {activeWorkoutAssignment.durationDays} day{activeWorkoutAssignment.durationDays > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {workoutEndDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Ends: {formatDate(workoutEndDate)}</span>
                        </div>
                      )}
                      {workoutEndDate && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>
                            {workoutDaysRemaining !== null ? `${workoutDaysRemaining} days to renewal` : "Renewal date pending"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-sm font-semibold">Renewal notification</p>
                        <p className="text-xs text-muted-foreground">Email/notify when less than 7 days remain.</p>
                      </div>
                      <Switch
                        checked={workoutRenewalEnabled}
                        onCheckedChange={(checked) => renewalMutation.mutate({ workoutRenewal: checked })}
                        disabled={!activeWorkoutAssignment || renewalMutation.isPending || isLoadingRenewals}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No workout plan assigned yet.</p>
                )}

                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); assignWorkoutMutation.mutate(); }}>
                  <div className="space-y-2">
                    <Label htmlFor="workoutPlan">Assign plan</Label>
                    <select
                      id="workoutPlan"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={selectedWorkoutPlan}
                      onChange={(e) => setSelectedWorkoutPlan(e.target.value)}
                    >
                      <option value="">Select a workout plan</option>
                      {workoutPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="workoutStart">Start date</Label>
                      <Input
                        id="workoutStart"
                        type="date"
                        value={workoutStartDate}
                        onChange={(e) => setWorkoutStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workoutDuration">Duration (days)</Label>
                      <Input
                        id="workoutDuration"
                        type="number"
                        min={1}
                        placeholder="Optional"
                        value={workoutDuration}
                        onChange={(e) => setWorkoutDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="shadow-energy"
                      disabled={assignWorkoutMutation.isPending || !selectedWorkoutPlan}
                    >
                      {assignWorkoutMutation.isPending ? "Assigning..." : "Assign workout plan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-energy/10 p-2">
                    <Utensils className="h-5 w-5 text-energy" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Diet Plan</CardTitle>
                    <CardDescription>Assign a nutrition program and track it here.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeDietAssignment ? (
                  <div className="rounded-lg border border-energy/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{assignedDietPlan?.name ?? "Assigned plan"}</p>
                        {assignedDietPlan?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{assignedDietPlan.description}</p>
                        )}
                      </div>
                      <Badge variant={activeDietAssignment.isActive ? "secondary" : "outline"}>
                        {activeDietAssignment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {formatDate(activeDietAssignment.startDate)}</span>
                      </div>
                      {activeDietAssignment.durationDays && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>
                            Duration: {activeDietAssignment.durationDays} day{activeDietAssignment.durationDays > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {dietEndDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Ends: {formatDate(dietEndDate)}</span>
                        </div>
                      )}
                      {dietEndDate && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>
                            {dietDaysRemaining !== null ? `${dietDaysRemaining} days to renewal` : "Renewal date pending"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-sm font-semibold">Renewal notification</p>
                        <p className="text-xs text-muted-foreground">Email/notify when less than 7 days remain.</p>
                      </div>
                      <Switch
                        checked={dietRenewalEnabled}
                        onCheckedChange={(checked) => renewalMutation.mutate({ dietRenewal: checked })}
                        disabled={!activeDietAssignment || renewalMutation.isPending || isLoadingRenewals}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No diet plan assigned yet.</p>
                )}

                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); assignDietMutation.mutate(); }}>
                  <div className="space-y-2">
                    <Label htmlFor="dietPlan">Assign plan</Label>
                    <select
                      id="dietPlan"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={selectedDietPlan}
                      onChange={(e) => setSelectedDietPlan(e.target.value)}
                    >
                      <option value="">Select a diet plan</option>
                      {dietPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dietStart">Start date</Label>
                      <Input
                        id="dietStart"
                        type="date"
                        value={dietStartDate}
                        onChange={(e) => setDietStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dietDuration">Duration (days)</Label>
                      <Input
                        id="dietDuration"
                        type="number"
                        min={1}
                        placeholder="Optional"
                        value={dietDuration}
                        onChange={(e) => setDietDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="shadow-energy"
                      disabled={assignDietMutation.isPending || !selectedDietPlan}
                    >
                      {assignDietMutation.isPending ? "Assigning..." : "Assign diet plan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Photos</CardTitle>
              <CardDescription>Planned in Sprint 4</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No photos uploaded yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCheckIn} onOpenChange={(open) => !open && setSelectedCheckIn(null)}>
        <DialogContent className="max-w-xl">
          {selectedCheckIn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = checkInMeta[selectedCheckIn.type].icon;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  {checkInMeta[selectedCheckIn.type].label}
                </DialogTitle>
                <DialogDescription>
                  Submitted {new Date(selectedCheckIn.submittedAt).toLocaleString()} • Status: {selectedCheckIn.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {renderCheckInDetails(selectedCheckIn)}
                {selectedCheckIn.notes && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedCheckIn.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedCheckIn(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClientDetailPage;
