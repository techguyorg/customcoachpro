import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Scale, Camera, Target, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import type { ClientMeasurement, ProgressPhoto, ClientGoal } from "@/hooks/useClientProgress";
import { MeasurementChart } from "./MeasurementChart";

interface StatDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "weight" | "photos" | "goals" | "checkins";
  measurements?: ClientMeasurement[];
  photos?: ProgressPhoto[];
  goals?: ClientGoal[];
  weightProgress?: { change: number; trend: string } | null;
}

export function StatDetailModal({
  open,
  onOpenChange,
  type,
  measurements = [],
  photos = [],
  goals = [],
  weightProgress,
}: StatDetailModalProps) {
  const getTitle = () => {
    switch (type) {
      case "weight": return "Weight History";
      case "photos": return "Progress Photos Overview";
      case "goals": return "Goals Summary";
      case "checkins": return "Check-in History";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "weight": return <Scale className="w-5 h-5" />;
      case "photos": return <Camera className="w-5 h-5" />;
      case "goals": return <Target className="w-5 h-5" />;
      case "checkins": return <Calendar className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {type === "weight" && "Track your weight changes over time"}
            {type === "photos" && "Visual documentation of your progress"}
            {type === "goals" && "Your active and completed goals"}
            {type === "checkins" && "Your measurement history"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {type === "weight" && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Starting</p>
                  <p className="text-xl font-bold">
                    {measurements.length > 0 
                      ? `${measurements[measurements.length - 1].weight_kg} kg`
                      : "—"
                    }
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-xl font-bold">
                    {measurements.length > 0 
                      ? `${measurements[0].weight_kg} kg`
                      : "—"
                    }
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Change</p>
                  <div className="flex items-center justify-center gap-1">
                    {weightProgress?.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-success" />
                    ) : weightProgress?.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-warning" />
                    ) : null}
                    <p className={`text-xl font-bold ${
                      weightProgress?.change && weightProgress.change < 0 
                        ? "text-success" 
                        : weightProgress?.change && weightProgress.change > 0
                        ? "text-warning"
                        : ""
                    }`}>
                      {weightProgress 
                        ? `${weightProgress.change > 0 ? "+" : ""}${weightProgress.change.toFixed(1)} kg`
                        : "—"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              {measurements.length > 1 && (
                <div className="bg-card border rounded-lg p-4">
                  <MeasurementChart
                    measurements={measurements}
                    dataKey="weight_kg"
                    label="Weight (kg)"
                    color="hsl(var(--primary))"
                  />
                </div>
              )}

              {/* Recent entries */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Measurements</h4>
                <div className="space-y-2">
                  {measurements.slice(0, 10).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">{format(new Date(m.recorded_at), "MMM d, yyyy")}</span>
                      <span className="font-semibold">{m.weight_kg} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {type === "photos" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Photos</p>
                  <p className="text-2xl font-bold">{photos.length}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Photo Types</p>
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {Array.from(new Set(photos.map(p => p.pose_type))).map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Timeline of photos */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Photo Timeline</h4>
                {photos.length > 0 ? (
                  <div className="space-y-2">
                    {photos.slice(0, 10).map((photo) => (
                      <div key={photo.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Camera className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">{photo.pose_type.replace("_", " ")}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(photo.recorded_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No photos uploaded yet
                  </p>
                )}
              </div>
            </div>
          )}

          {type === "goals" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                  <p className="text-2xl font-bold text-primary">
                    {goals.filter(g => g.status === "active").length}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-success">
                    {goals.filter(g => g.status === "completed").length}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {goals.filter(g => g.status === "active").length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Active Goals</h4>
                    {goals.filter(g => g.status === "active").map(goal => (
                      <div key={goal.id} className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="font-medium">{goal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{goal.goal_type}</Badge>
                          {goal.target_value && (
                            <span className="text-xs text-muted-foreground">
                              Target: {goal.target_value} {goal.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {goals.filter(g => g.status === "completed").length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-success">Completed Goals 🏆</h4>
                    {goals.filter(g => g.status === "completed").map(goal => (
                      <div key={goal.id} className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <p className="font-medium">{goal.title}</p>
                        <Badge variant="outline" className="text-xs mt-1">{goal.goal_type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {type === "checkins" && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Measurements</p>
                <p className="text-2xl font-bold">{measurements.length}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Measurements</h4>
                <div className="space-y-2">
                  {measurements.slice(0, 15).map((m) => (
                    <div key={m.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {format(new Date(m.recorded_at), "MMM d, yyyy")}
                        </span>
                        <span className="font-bold">{m.weight_kg} kg</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                        {m.body_fat_pct && <span>Body Fat: {m.body_fat_pct}%</span>}
                        {m.waist_cm && <span>Waist: {m.waist_cm}cm</span>}
                        {m.chest_cm && <span>Chest: {m.chest_cm}cm</span>}
                        {m.hips_cm && <span>Hips: {m.hips_cm}cm</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
