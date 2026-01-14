import { useState, useMemo } from "react";
import { 
  Scale, 
  TrendingUp, 
  TrendingDown,
  Camera, 
  Target,
  Plus,
  Calendar,
  Activity,
  ChevronRight,
  Ruler,
  BarChart3,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  useClientMeasurements, 
  useProgressPhotos,
  useClientGoals,
  calculateWeightProgress,
  getLatestMeasurement,
  ClientGoal
} from "@/hooks/useClientProgress";
import { AddMeasurementDialog } from "@/components/client/AddMeasurementDialog";
import { AddPhotoDialog } from "@/components/client/AddPhotoDialog";
import { AddGoalDialog } from "@/components/client/AddGoalDialog";
import { MeasurementChart } from "@/components/client/MeasurementChart";
import { PhotoGallery } from "@/components/client/PhotoGallery";
import { GoalCard } from "@/components/client/GoalCard";
import { GoalDetailModal } from "@/components/client/GoalDetailModal";
import { DateRangeSelector, DateRangeOption, getDateRangeStart } from "@/components/client/DateRangeSelector";
import { StatDetailModal } from "@/components/client/StatDetailModal";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";
import { ProgressReportPdf } from "@/components/pdf/ProgressReportPdf";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProgressPage() {
  const { user } = useAuth();
  const { data: measurements = [], isLoading: loadingMeasurements } = useClientMeasurements();
  const { data: photos = [], isLoading: loadingPhotos } = useProgressPhotos();
  const { data: goals = [], isLoading: loadingGoals } = useClientGoals();
  
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ClientGoal | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("3M");
  const [statModalType, setStatModalType] = useState<"weight" | "photos" | "goals" | "checkins" | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhoto1, setComparePhoto1] = useState<string>("");
  const [comparePhoto2, setComparePhoto2] = useState<string>("");

  const latestMeasurement = getLatestMeasurement(measurements);
  const weightProgress = calculateWeightProgress(measurements);
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  // Filter measurements by date range
  const filteredMeasurements = useMemo(() => {
    const startDate = getDateRangeStart(dateRange);
    if (!startDate) return measurements;
    return measurements.filter(m => new Date(m.recorded_at) >= startDate);
  }, [measurements, dateRange]);

  // Group photos by month for better organization
  const photosByMonth = useMemo(() => {
    const groups: Record<string, typeof photos> = {};
    photos.forEach(photo => {
      const monthKey = format(new Date(photo.recorded_at), "yyyy-MM");
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(photo);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, photos]) => ({
        month: format(new Date(key + "-01"), "MMMM yyyy"),
        photos
      }));
  }, [photos]);

  // Prepare PDF data
  const pdfData = {
    clientName: user?.fullName || "Client",
    generatedDate: new Date().toISOString(),
    measurements: measurements.map(m => ({
      date: m.recorded_at,
      weight: m.weight_kg,
      bodyFat: m.body_fat_pct || undefined,
      waist: m.waist_cm || undefined,
      chest: m.chest_cm || undefined,
    })),
    goals: goals.map(g => ({
      title: g.title,
      type: g.goal_type,
      status: g.status,
      progress: g.target_value && g.current_value && g.starting_value
        ? Math.round(((g.current_value - g.starting_value) / (g.target_value - g.starting_value)) * 100)
        : 0,
      target: g.target_value || undefined,
      current: g.current_value || undefined,
      unit: g.unit || undefined,
    })),
    stats: {
      startingWeight: measurements.length > 0 ? measurements[measurements.length - 1].weight_kg : undefined,
      currentWeight: latestMeasurement?.weight_kg,
      weightChange: weightProgress?.change,
      totalCheckIns: measurements.length,
      photosUploaded: photos.length,
      goalsCompleted: completedGoals.length,
      activeGoals: activeGoals.length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            My Progress
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your fitness journey and celebrate your wins
          </p>
        </div>
        <div className="flex gap-2">
          <ExportPdfButton
            document={<ProgressReportPdf data={pdfData} />}
            filename={`progress-report-${format(new Date(), "yyyy-MM-dd")}.pdf`}
            label="Export Report"
          />
          <Button onClick={() => setMeasurementDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Progress
          </Button>
        </div>
      </div>

      {/* Quick Stats - Now Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setStatModalType("weight")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-5 h-5 text-muted-foreground" />
              {weightProgress?.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-success" />
              ) : weightProgress?.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-warning" />
              ) : null}
            </div>
            <p className="text-2xl font-bold">
              {latestMeasurement?.weight_kg || "—"} kg
            </p>
            <p className="text-xs text-muted-foreground">Current Weight</p>
            {weightProgress && (
              <p className={`text-xs mt-1 ${
                weightProgress.change < 0 ? "text-success" : "text-warning"
              }`}>
                {weightProgress.change > 0 ? "+" : ""}{weightProgress.change.toFixed(1)} kg total
              </p>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setStatModalType("photos")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">{photos.length}</Badge>
            </div>
            <p className="text-2xl font-bold">{photos.length}</p>
            <p className="text-xs text-muted-foreground">Progress Photos</p>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setPhotoDialogOpen(true);
              }}
            >
              Add photo <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setStatModalType("goals")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">{activeGoals.length} active</Badge>
            </div>
            <p className="text-2xl font-bold">{completedGoals.length}</p>
            <p className="text-xs text-muted-foreground">Goals Achieved</p>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setGoalDialogOpen(true);
              }}
            >
              Set goal <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setStatModalType("checkins")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{measurements.length}</p>
            <p className="text-xs text-muted-foreground">Check-ins Logged</p>
            {latestMeasurement && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {format(new Date(latestMeasurement.recorded_at), "MMM d")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Weight Chart with Date Range Selector */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Weight Progress
                  </CardTitle>
                  <CardDescription>
                    Your weight trend over time
                  </CardDescription>
                </div>
                <DateRangeSelector value={dateRange} onChange={setDateRange} />
              </div>
            </CardHeader>
            <CardContent>
              {filteredMeasurements.length > 1 ? (
                <MeasurementChart 
                  measurements={filteredMeasurements} 
                  dataKey="weight_kg" 
                  label="Weight (kg)"
                  color="hsl(var(--primary))"
                />
              ) : (
                <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
                  <div className="text-center">
                    <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {measurements.length > 1 
                        ? "No data for the selected time range"
                        : "Log at least 2 measurements to see your chart"
                      }
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setMeasurementDialogOpen(true)}
                    >
                      Log First Measurement
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeGoals.slice(0, 4).map(goal => (
                    <div 
                      key={goal.id} 
                      className="cursor-pointer" 
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <GoalCard goal={goal} compact />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Photos - Improved Design */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Recent Progress Photos
                  </CardTitle>
                  {photos.length >= 2 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCompareMode(!compareMode);
                        if (!compareMode && photos.length >= 2) {
                          setComparePhoto1(photos[photos.length - 1].id);
                          setComparePhoto2(photos[0].id);
                        }
                      }}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      {compareMode ? "Exit Compare" : "Compare"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {compareMode && photos.length >= 2 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Select value={comparePhoto1} onValueChange={setComparePhoto1}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select first photo" />
                          </SelectTrigger>
                          <SelectContent>
                            {photos.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {format(new Date(p.recorded_at), "MMM d, yyyy")} - {p.pose_type.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Select value={comparePhoto2} onValueChange={setComparePhoto2}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select second photo" />
                          </SelectTrigger>
                          <SelectContent>
                            {photos.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {format(new Date(p.recorded_at), "MMM d, yyyy")} - {p.pose_type.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <PhotoGallery 
                        photos={photos.filter(p => p.id === comparePhoto1)} 
                        compact 
                      />
                      <PhotoGallery 
                        photos={photos.filter(p => p.id === comparePhoto2)} 
                        compact 
                      />
                    </div>
                  </div>
                ) : (
                  <PhotoGallery photos={photos.slice(0, 4)} compact />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="measurements" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Body Measurements</CardTitle>
                <CardDescription>Track all your body metrics</CardDescription>
              </div>
              <Button onClick={() => setMeasurementDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Measurement
              </Button>
            </CardHeader>
            <CardContent>
              {measurements.length > 0 ? (
                <div className="space-y-6">
                  {/* Latest Measurements Grid */}
                  {latestMeasurement && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {latestMeasurement.chest_cm && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground">Chest</p>
                          <p className="text-xl font-bold">{latestMeasurement.chest_cm} cm</p>
                        </div>
                      )}
                      {latestMeasurement.waist_cm && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground">Waist</p>
                          <p className="text-xl font-bold">{latestMeasurement.waist_cm} cm</p>
                        </div>
                      )}
                      {latestMeasurement.hips_cm && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground">Hips</p>
                          <p className="text-xl font-bold">{latestMeasurement.hips_cm} cm</p>
                        </div>
                      )}
                      {latestMeasurement.body_fat_pct && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground">Body Fat</p>
                          <p className="text-xl font-bold">{latestMeasurement.body_fat_pct}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Measurement History */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Weight</th>
                          <th className="text-left p-3 font-medium hidden sm:table-cell">Waist</th>
                          <th className="text-left p-3 font-medium hidden md:table-cell">Body Fat</th>
                          <th className="text-left p-3 font-medium hidden lg:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {measurements.slice(0, 10).map(m => (
                          <tr key={m.id} className="hover:bg-muted/30">
                            <td className="p-3">{format(new Date(m.recorded_at), "MMM d, yyyy")}</td>
                            <td className="p-3 font-medium">{m.weight_kg} kg</td>
                            <td className="p-3 hidden sm:table-cell">{m.waist_cm || "—"}</td>
                            <td className="p-3 hidden md:table-cell">{m.body_fat_pct ? `${m.body_fat_pct}%` : "—"}</td>
                            <td className="p-3 hidden lg:table-cell text-muted-foreground truncate max-w-[200px]">
                              {m.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Ruler className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No measurements yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your progress by logging your first measurement
                  </p>
                  <Button onClick={() => setMeasurementDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Measurement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Progress Photos</CardTitle>
                <CardDescription>Visual documentation of your journey</CardDescription>
              </div>
              <Button onClick={() => setPhotoDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </CardHeader>
            <CardContent>
              {photos.length > 0 ? (
                <div className="space-y-8">
                  {/* Photos grouped by month */}
                  {photosByMonth.map(({ month, photos: monthPhotos }) => (
                    <div key={month}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{month}</h3>
                      <PhotoGallery photos={monthPhotos} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No progress photos yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Capture your transformation with progress photos
                  </p>
                  <Button onClick={() => setPhotoDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload First Photo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Goals</CardTitle>
                <CardDescription>Set targets and track your achievements</CardDescription>
              </div>
              <Button onClick={() => setGoalDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <div className="space-y-6">
                  {activeGoals.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Active Goals
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {activeGoals.map(goal => (
                          <div 
                            key={goal.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedGoal(goal)}
                          >
                            <GoalCard goal={goal} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedGoals.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-success">
                        🏆 Completed Goals
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {completedGoals.map(goal => (
                          <div 
                            key={goal.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedGoal(goal)}
                          >
                            <GoalCard goal={goal} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No goals set</h3>
                  <p className="text-muted-foreground mb-4">
                    Set your first goal to stay motivated
                  </p>
                  <Button onClick={() => setGoalDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Set First Goal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddMeasurementDialog 
        open={measurementDialogOpen} 
        onOpenChange={setMeasurementDialogOpen} 
      />
      <AddPhotoDialog 
        open={photoDialogOpen} 
        onOpenChange={setPhotoDialogOpen} 
      />
      <AddGoalDialog 
        open={goalDialogOpen} 
        onOpenChange={setGoalDialogOpen} 
      />
      <GoalDetailModal
        goal={selectedGoal}
        open={!!selectedGoal}
        onOpenChange={(open) => !open && setSelectedGoal(null)}
      />
      <StatDetailModal
        open={!!statModalType}
        onOpenChange={(open) => !open && setStatModalType(null)}
        type={statModalType || "weight"}
        measurements={measurements}
        photos={photos}
        goals={goals}
        weightProgress={weightProgress}
      />
    </div>
  );
}
