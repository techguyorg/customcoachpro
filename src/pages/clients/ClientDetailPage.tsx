import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, Target, Scale, TrendingDown, Edit, Ruler, Dumbbell, Utensils } from "lucide-react";
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

  useEffect(() => {
    if (data?.profile?.preferredUnitSystem === "metric") {
      setUnitSystem("metric");
    }
  }, [data?.profile?.preferredUnitSystem]);

  const weightUnit = useMemo(() => (unitSystem === "imperial" ? "lbs" : "kg"), [unitSystem]);
  const lengthUnit = useMemo(() => (unitSystem === "imperial" ? "in" : "cm"), [unitSystem]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
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

  const profile = data.profile;
  const displayName = profile.displayName || data.email;

  const storedWeightUnit = (profile.preferredUnitSystem as UnitSystem | undefined) ?? "imperial";
  const currentWeight = convertWeight(profile.currentWeight ?? undefined, storedWeightUnit, unitSystem);
  const startWeight = convertWeight(profile.startWeight ?? profile.currentWeight ?? undefined, storedWeightUnit, unitSystem);
  const targetWeight = convertWeight(profile.targetWeight ?? undefined, storedWeightUnit, unitSystem);

  const height = convertLength(profile.heightCm ?? undefined, unitSystem);
  const neck = convertLength(profile.neckCm ?? undefined, unitSystem);
  const arms = convertLength(profile.armsCm ?? undefined, unitSystem);
  const quads = convertLength(profile.quadsCm ?? undefined, unitSystem);
  const hips = convertLength(profile.hipsCm ?? undefined, unitSystem);

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
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notes feature comes later (Sprint 3).</p>
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

        <TabsContent value="checkins">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
              <CardDescription>Planned in Sprint 3</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No check-ins yet.</p>
            </CardContent>
          </Card>
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
                      {activeWorkoutAssignment.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Ends: {formatDate(activeWorkoutAssignment.endDate)}</span>
                        </div>
                      )}
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
                      {activeDietAssignment.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Ends: {formatDate(activeDietAssignment.endDate)}</span>
                        </div>
                      )}
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
    </div>
  );
}

export default ClientDetailPage;
