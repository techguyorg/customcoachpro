import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, Target, Scale, TrendingDown, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import coachService from "@/services/coachService";

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const clientId = id ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["coach", "client", clientId],
    queryFn: () => coachService.getClient(clientId),
    enabled: !!clientId,
  });

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

  const currentWeight = Number(profile.currentWeight ?? 0);
  const startWeight = Number(profile.startWeight ?? profile.currentWeight ?? 0);
  const targetWeight = Number(profile.targetWeight ?? 0);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-xl font-bold">{currentWeight || 0} lbs</p>
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
                <p className="text-xl font-bold">{targetWeight || 0} lbs</p>
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
                <p className="text-xl font-bold">{weightLost} lbs</p>
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
            {weightLost} of {totalToLose} lbs to goal
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
          <div className="grid gap-4 lg:grid-cols-2">
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
