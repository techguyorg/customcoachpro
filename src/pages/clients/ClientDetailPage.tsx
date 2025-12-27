import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, Target, Scale, TrendingDown, Edit, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import coachService from "@/services/coachService";

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
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");

  const clientId = id ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["coach", "client", clientId],
    queryFn: () => coachService.getClient(clientId),
    enabled: !!clientId,
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Plans</CardTitle>
              <CardDescription>Planned in Sprint 3</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No plans assigned yet.</p>
            </CardContent>
          </Card>
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
