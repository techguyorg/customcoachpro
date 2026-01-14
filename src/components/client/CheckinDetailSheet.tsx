import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  Calendar, 
  Dumbbell, 
  UtensilsCrossed, 
  Moon, 
  Zap, 
  Brain, 
  Smile,
  Trophy,
  AlertTriangle,
  MessageSquare,
  Star
} from "lucide-react";

export interface CheckinData {
  id: string;
  checkin_date: string;
  period_start?: string | null;
  period_end?: string | null;
  status: string;
  diet_adherence?: number | null;
  workout_adherence?: number | null;
  sleep_quality?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  mood_rating?: number | null;
  diet_notes?: string | null;
  workout_notes?: string | null;
  general_notes?: string | null;
  wins?: string | null;
  challenges?: string | null;
  coach_feedback?: string | null;
  coach_rating?: number | null;
  reviewed_at?: string | null;
}

interface CheckinDetailSheetProps {
  checkin: CheckinData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RatingBar({ value, label, icon: Icon, color }: { 
  value: number | null | undefined; 
  label: string; 
  icon: React.ElementType;
  color: string;
}) {
  if (!value) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm">{label}</span>
        </div>
        <Badge variant="outline">{value}/10</Badge>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${color.replace("text-", "bg-")}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function CheckinDetailSheet({ checkin, open, onOpenChange }: CheckinDetailSheetProps) {
  if (!checkin) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Check-in Details
          </SheetTitle>
          <SheetDescription>
            {format(new Date(checkin.checkin_date), "MMMM d, yyyy")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={
                  checkin.status === 'reviewed' 
                    ? 'bg-success/20 text-success border-success/30' 
                    : checkin.status === 'submitted'
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : ''
                }
              >
                {checkin.status}
              </Badge>
              {checkin.period_start && checkin.period_end && (
                <span className="text-xs text-muted-foreground">
                  Period: {format(new Date(checkin.period_start), "MMM d")} - {format(new Date(checkin.period_end), "MMM d")}
                </span>
              )}
            </div>

            {/* Adherence & Wellness Ratings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Adherence & Wellness</h4>
              <div className="space-y-4">
                <RatingBar 
                  value={checkin.diet_adherence} 
                  label="Diet Adherence" 
                  icon={UtensilsCrossed}
                  color="text-orange-500"
                />
                <RatingBar 
                  value={checkin.workout_adherence} 
                  label="Workout Adherence" 
                  icon={Dumbbell}
                  color="text-blue-500"
                />
                <RatingBar 
                  value={checkin.sleep_quality} 
                  label="Sleep Quality" 
                  icon={Moon}
                  color="text-indigo-500"
                />
                <RatingBar 
                  value={checkin.energy_level} 
                  label="Energy Level" 
                  icon={Zap}
                  color="text-yellow-500"
                />
                <RatingBar 
                  value={checkin.stress_level} 
                  label="Stress Level" 
                  icon={Brain}
                  color="text-red-500"
                />
                <RatingBar 
                  value={checkin.mood_rating} 
                  label="Overall Mood" 
                  icon={Smile}
                  color="text-green-500"
                />
              </div>
            </div>

            <Separator />

            {/* Notes Section */}
            {(checkin.diet_notes || checkin.workout_notes || checkin.general_notes) && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Notes</h4>
                
                {checkin.diet_notes && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Diet Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {checkin.diet_notes}
                    </p>
                  </div>
                )}

                {checkin.workout_notes && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Workout Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {checkin.workout_notes}
                    </p>
                  </div>
                )}

                {checkin.general_notes && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">General Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {checkin.general_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Wins & Challenges */}
            {(checkin.wins || checkin.challenges) && (
              <>
                <Separator />
                <div className="grid gap-4">
                  {checkin.wins && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium text-success">Wins</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{checkin.wins}</p>
                    </div>
                  )}

                  {checkin.challenges && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium text-warning">Challenges</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{checkin.challenges}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Coach Feedback */}
            {checkin.coach_feedback && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Coach Feedback</h4>
                    {checkin.coach_rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: checkin.coach_rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          {checkin.coach_rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{checkin.coach_feedback}</p>
                    {checkin.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Reviewed on {format(new Date(checkin.reviewed_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
