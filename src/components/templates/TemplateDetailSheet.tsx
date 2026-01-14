import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Calendar, 
  Clock, 
  Target, 
  Zap, 
  Dumbbell,
  Play,
  Loader2,
  Edit,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { useWorkoutTemplateDetail } from "@/hooks/useWorkoutTemplates";
import { useStartProgram } from "@/hooks/useStartProgram";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";
import { WorkoutPlanPdf } from "@/components/pdf/WorkoutPlanPdf";
import { WorkoutProgramEditor } from "./WorkoutProgramEditor";
import { ExerciseDetailSheet } from "@/components/exercises/ExerciseDetailSheet";

interface TemplateDetailSheetProps {
  templateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatLabel = (value: string) => 
  value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

const difficultyColors = {
  beginner: "bg-success/20 text-success border-success/30",
  intermediate: "bg-warning/20 text-warning border-warning/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

const typeColors: Record<string, string> = {
  push_pull_legs: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  upper_lower: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  full_body: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  bro_split: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  strength: "bg-red-500/20 text-red-400 border-red-500/30",
  hypertrophy: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  powerbuilding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sport_specific: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  cardio_conditioning: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  functional: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  bodyweight: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function TemplateDetailSheet({ templateId, open, onOpenChange }: TemplateDetailSheetProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { data: template, isLoading } = useWorkoutTemplateDetail(templateId);
  const startProgram = useStartProgram();

  // Check if user can edit this template
  const canEdit = template && (template.created_by === user?.id || user?.roles?.includes('super_admin'));

  const handleStartProgram = () => {
    if (!templateId) return;
    startProgram.mutate({ templateId });
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false); // Reset edit mode when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {isLoading ? (
              <TemplateDetailSkeleton />
            ) : template ? (
              isEditing && templateId ? (
                // Edit Mode - Show WorkoutProgramEditor
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <h2 className="font-semibold text-lg">Edit Program</h2>
                      <p className="text-sm text-muted-foreground">{template.name}</p>
                    </div>
                  </div>
                  <WorkoutProgramEditor templateId={templateId} onClose={() => setIsEditing(false)} />
                </div>
              ) : (
              // View Mode
              <div className="space-y-6">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl pr-8">{template.name}</SheetTitle>
                  {template.goal && (
                    <p className="text-primary flex items-center gap-2 mt-1">
                      <Target className="w-4 h-4" />
                      {template.goal}
                    </p>
                  )}
                </SheetHeader>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{template.days_per_week}</p>
                    <p className="text-xs text-muted-foreground">Days/Week</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{template.duration_weeks || "—"}</p>
                    <p className="text-xs text-muted-foreground">Weeks</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Dumbbell className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{template.total_exercises}</p>
                    <p className="text-xs text-muted-foreground">Exercises</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Zap className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{template.is_periodized ? "Yes" : "No"}</p>
                    <p className="text-xs text-muted-foreground">Periodized</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {template.is_system && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Shield className="w-3 h-3 mr-1" />
                      System Program
                    </Badge>
                  )}
                  {template.template_type && (
                    <Badge 
                      variant="outline" 
                      className={`${typeColors[template.template_type] || ""}`}
                    >
                      {formatLabel(template.template_type)}
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={difficultyColors[template.difficulty]}
                  >
                    {formatLabel(template.difficulty)}
                  </Badge>
                </div>

                {/* Description */}
                {template.description && (
                  <div>
                    <p className="text-muted-foreground leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={handleStartProgram}
                    disabled={startProgram.isPending}
                  >
                    {startProgram.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Start Program
                  </Button>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Program
                    </Button>
                  )}
                  <ExportPdfButton
                    document={
                      <WorkoutPlanPdf
                        data={{
                          name: template.name,
                          description: template.description || undefined,
                          goal: template.goal || undefined,
                          difficulty: formatLabel(template.difficulty),
                          daysPerWeek: template.days_per_week,
                          durationWeeks: template.duration_weeks || undefined,
                          templateType: template.template_type || undefined,
                          weeks: template.weeks?.map(w => ({
                            weekNumber: w.week_number,
                            name: w.name || undefined,
                            focus: w.focus || undefined,
                            days: w.days.map(d => ({
                              name: d.name,
                              dayNumber: d.day_number,
                              exercises: d.exercises.map(e => ({
                                name: e.exercise_name || e.exercise?.name || e.custom_exercise_name || "Custom Exercise",
                                sets: `${e.sets_min}${e.sets_max && e.sets_max !== e.sets_min ? `-${e.sets_max}` : ""}`,
                                reps: `${e.reps_min}${e.reps_max && e.reps_max !== e.reps_min ? `-${e.reps_max}` : ""}`,
                                notes: e.notes || undefined,
                                instructions: e.exercise?.instructions?.join('. ') || undefined,
                                muscleGroup: e.primary_muscle || e.exercise?.primary_muscle || undefined,
                                equipment: e.equipment || e.exercise?.equipment || undefined,
                                restTime: e.rest_seconds_min ? `${e.rest_seconds_min}${e.rest_seconds_max ? `-${e.rest_seconds_max}` : ""}s` : undefined,
                              })),
                              notes: d.notes || undefined,
                            })),
                          })) || [],
                        }}
                      />
                    }
                    filename={`${template.name.replace(/\s+/g, "-").toLowerCase()}-workout-plan.pdf`}
                    variant="outline"
                    label="Export"
                  />
                </div>

                <Separator />

                {/* Program Structure */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Program Structure</h3>
                  
                  {template.weeks && template.weeks.length > 0 ? (
                    <Accordion type="multiple" className="space-y-2">
                      {template.weeks.map((week, weekIndex) => (
                        <AccordionItem 
                          key={week.id} 
                          value={week.id}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center">
                                {week.week_number}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {week.name || `Week ${week.week_number}`}
                                </p>
                                {week.focus && (
                                  <p className="text-xs text-muted-foreground">
                                    Focus: {week.focus}
                                  </p>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-3 mt-2">
                              {week.days.map((day) => (
                                <div 
                                  key={day.id}
                                  className="bg-muted/30 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                      <span className="w-6 h-6 rounded bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                                        {day.day_number}
                                      </span>
                                      {day.name}
                                    </h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {day.exercises.length} exercises
                                    </Badge>
                                  </div>
                                  
                                  {day.exercises.length > 0 && (
                                    <div className="space-y-1.5 mt-3">
                                      {day.exercises.map((ex, exIndex) => (
                                        <button 
                                          key={ex.id}
                                          className="flex items-center gap-3 text-sm w-full p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                                          onClick={() => {
                                            if (ex.exercise_id) {
                                              setSelectedExerciseId(ex.exercise_id);
                                            }
                                          }}
                                        >
                                          <span className="text-muted-foreground w-4 text-right">
                                            {exIndex + 1}.
                                          </span>
                                          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                          <span className="flex-1 truncate font-medium">
                                            {ex.exercise?.name || ex.exercise_name || ex.custom_exercise_name || "Custom Exercise"}
                                          </span>
                                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                                            {ex.sets_min}{ex.sets_max && ex.sets_max !== ex.sets_min ? `-${ex.sets_max}` : ""} × {ex.reps_min}{ex.reps_max && ex.reps_max !== ex.reps_min ? `-${ex.reps_max}` : ""}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {day.notes && (
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                      {day.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                      <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No program structure defined yet</p>
                    </div>
                  )}
                </div>
              </div>
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Template not found
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Exercise Detail Sheet */}
        <ExerciseDetailSheet
          exerciseId={selectedExerciseId}
          open={!!selectedExerciseId}
          onOpenChange={(open) => !open && setSelectedExerciseId(null)}
        />
      </SheetContent>
    </Sheet>
  );
}

function TemplateDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
