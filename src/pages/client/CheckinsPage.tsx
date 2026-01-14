import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  ClipboardCheck, 
  Calendar as CalendarIcon, 
  Dumbbell, 
  UtensilsCrossed,
  Moon,
  Zap,
  Brain,
  Smile,
  Camera,
  Trophy,
  AlertTriangle,
  Loader2,
  Send,
  Save,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSubmitCheckin, useSaveCheckinDraft, useMyCheckins, useClientCheckinTemplate } from "@/hooks/useCheckins";
import { useClientMeasurements, getLatestMeasurement } from "@/hooks/useClientProgress";
import { AddMeasurementDialog } from "@/components/client/AddMeasurementDialog";
import { CheckinDetailSheet, CheckinData } from "@/components/client/CheckinDetailSheet";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const checkinSchema = z.object({
  checkin_date: z.string(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  diet_adherence: z.number().min(1).max(10).optional(),
  workout_adherence: z.number().min(1).max(10).optional(),
  sleep_quality: z.number().min(1).max(10).optional(),
  energy_level: z.number().min(1).max(10).optional(),
  stress_level: z.number().min(1).max(10).optional(),
  mood_rating: z.number().min(1).max(10).optional(),
  diet_notes: z.string().optional(),
  workout_notes: z.string().optional(),
  general_notes: z.string().optional(),
  wins: z.string().optional(),
  challenges: z.string().optional(),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

export default function CheckinsPage() {
  const { user } = useAuth();
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinData | null>(null);
  const { data: checkins = [], isLoading } = useMyCheckins();
  const { data: template } = useClientCheckinTemplate();
  const { data: measurements = [] } = useClientMeasurements();
  const submitCheckin = useSubmitCheckin();
  const saveDraft = useSaveCheckinDraft();

  const latestMeasurement = getLatestMeasurement(measurements);
  const hasCoach = !!template;

  const [checkinDate, setCheckinDate] = useState<Date>(new Date());
  const [periodStart, setPeriodStart] = useState<Date | undefined>();
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>();

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      checkin_date: new Date().toISOString().split('T')[0],
      diet_adherence: 7,
      workout_adherence: 7,
      sleep_quality: 7,
      energy_level: 7,
      stress_level: 5,
      mood_rating: 7,
    },
  });

  const onSubmit = async (data: CheckinFormData) => {
    try {
      await submitCheckin.mutateAsync({
        checkin_date: format(checkinDate, "yyyy-MM-dd"),
        period_start: periodStart ? format(periodStart, "yyyy-MM-dd") : null,
        period_end: periodEnd ? format(periodEnd, "yyyy-MM-dd") : null,
        diet_adherence: data.diet_adherence || null,
        workout_adherence: data.workout_adherence || null,
        sleep_quality: data.sleep_quality || null,
        energy_level: data.energy_level || null,
        stress_level: data.stress_level || null,
        mood_rating: data.mood_rating || null,
        diet_notes: data.diet_notes || null,
        workout_notes: data.workout_notes || null,
        general_notes: data.general_notes || null,
        wins: data.wins || null,
        challenges: data.challenges || null,
        measurement_id: latestMeasurement?.id || null,
      });
      toast.success("Check-in submitted successfully! Your coach will be notified.");
      form.reset();
    } catch (error) {
      toast.error("Failed to submit check-in");
    }
  };

  const handleSaveDraft = async () => {
    const data = form.getValues();
    try {
      await saveDraft.mutateAsync({
        checkin_date: data.checkin_date,
        diet_adherence: data.diet_adherence || null,
        workout_adherence: data.workout_adherence || null,
        sleep_quality: data.sleep_quality || null,
        energy_level: data.energy_level || null,
        stress_level: data.stress_level || null,
        mood_rating: data.mood_rating || null,
        diet_notes: data.diet_notes || null,
        workout_notes: data.workout_notes || null,
        general_notes: data.general_notes || null,
        wins: data.wins || null,
        challenges: data.challenges || null,
      });
      toast.success("Draft saved");
    } catch (error) {
      toast.error("Failed to save draft");
    }
  };

  const recentCheckins = checkins.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Check-ins
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hasCoach ? "Submit your progress updates to your coach" : "Track your weekly progress"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Check-in Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Range */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="w-5 h-5" />
                  Check-in Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkinDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkinDate ? format(checkinDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={checkinDate} onSelect={(d) => d && setCheckinDate(d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Period Start (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !periodStart && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodStart ? format(periodStart, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={periodStart} onSelect={setPeriodStart} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Period End (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !periodEnd && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodEnd ? format(periodEnd, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={periodEnd} onSelect={setPeriodEnd} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adherence Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adherence & Wellness</CardTitle>
                <CardDescription>Rate your adherence and wellness on a scale of 1-10</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diet Adherence */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                      Diet Adherence
                    </Label>
                    <Badge variant="outline">{form.watch("diet_adherence")}/10</Badge>
                  </div>
                  <Slider
                    value={[form.watch("diet_adherence") || 7]}
                    onValueChange={([v]) => form.setValue("diet_adherence", v)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Workout Adherence */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-blue-500" />
                      Workout Adherence
                    </Label>
                    <Badge variant="outline">{form.watch("workout_adherence")}/10</Badge>
                  </div>
                  <Slider
                    value={[form.watch("workout_adherence") || 7]}
                    onValueChange={([v]) => form.setValue("workout_adherence", v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <Separator />

                {/* Sleep Quality */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      Sleep Quality
                    </Label>
                    <Badge variant="outline">{form.watch("sleep_quality")}/10</Badge>
                  </div>
                  <Slider
                    value={[form.watch("sleep_quality") || 7]}
                    onValueChange={([v]) => form.setValue("sleep_quality", v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                {/* Energy Level */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Energy Level
                    </Label>
                    <Badge variant="outline">{form.watch("energy_level")}/10</Badge>
                  </div>
                  <Slider
                    value={[form.watch("energy_level") || 7]}
                    onValueChange={([v]) => form.setValue("energy_level", v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                {/* Stress Level */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-red-500" />
                      Stress Level
                    </Label>
                    <Badge variant="outline">{form.watch("stress_level")}/10</Badge>
                  </div>
                  <Slider
                    value={[form.watch("stress_level") || 5]}
                    onValueChange={([v]) => form.setValue("stress_level", v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">1 = Very Low, 10 = Very High</p>
                </div>

                {/* Mood */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-green-500" />
                      Overall Mood
                    </Label>
                    <Badge variant="outline">{form.watch("mood_rating")}/10</Badge>
                  </div>
                  <Slider
                    value={[form.watch("mood_rating") || 7]}
                    onValueChange={([v]) => form.setValue("mood_rating", v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes & Reflections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diet_notes" className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    Diet Notes
                  </Label>
                  <Textarea
                    id="diet_notes"
                    placeholder="How was your nutrition this week? Any challenges or wins?"
                    {...form.register("diet_notes")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout_notes" className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Workout Notes
                  </Label>
                  <Textarea
                    id="workout_notes"
                    placeholder="How were your workouts? PRs, challenges, modifications?"
                    {...form.register("workout_notes")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="general_notes">General Notes</Label>
                  <Textarea
                    id="general_notes"
                    placeholder="Anything else you'd like to share with your coach?"
                    {...form.register("general_notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Wins & Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Wins & Challenges</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wins" className="flex items-center gap-2 text-success">
                    <Trophy className="w-4 h-4" />
                    This Week's Wins
                  </Label>
                  <Textarea
                    id="wins"
                    placeholder="What went well this week?"
                    className="min-h-[100px]"
                    {...form.register("wins")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="challenges" className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    Challenges Faced
                  </Label>
                  <Textarea
                    id="challenges"
                    placeholder="What was difficult? What can improve?"
                    className="min-h-[100px]"
                    {...form.register("challenges")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraft.isPending}
              >
                {saveDraft.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button type="submit" disabled={submitCheckin.isPending}>
                {submitCheckin.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Check-in
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestMeasurement ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-semibold">{latestMeasurement.weight_kg} kg</span>
                  </div>
                  {latestMeasurement.body_fat_pct && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Body Fat</span>
                      <span className="font-semibold">{latestMeasurement.body_fat_pct}%</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(latestMeasurement.recorded_at), "MMM d, yyyy")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No measurements logged yet</p>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setMeasurementDialogOpen(true)}
              >
                Update Measurements
              </Button>
            </CardContent>
          </Card>

          {/* Recent Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckins.length > 0 ? (
                <div className="space-y-3">
                  {recentCheckins.map((checkin) => (
                    <div 
                      key={checkin.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setSelectedCheckin(checkin as CheckinData)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {format(new Date(checkin.checkin_date), "MMM d, yyyy")}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs mt-1 ${
                            checkin.status === 'reviewed' 
                              ? 'bg-success/20 text-success' 
                              : checkin.status === 'submitted'
                              ? 'bg-primary/20 text-primary'
                              : ''
                          }`}
                        >
                          {checkin.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {checkin.coach_rating && (
                          <Badge>{checkin.coach_rating}/5 ⭐</Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No check-ins yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddMeasurementDialog 
        open={measurementDialogOpen} 
        onOpenChange={setMeasurementDialogOpen} 
      />
      
      <CheckinDetailSheet
        checkin={selectedCheckin}
        open={!!selectedCheckin}
        onOpenChange={(open) => !open && setSelectedCheckin(null)}
      />
    </div>
  );
}
