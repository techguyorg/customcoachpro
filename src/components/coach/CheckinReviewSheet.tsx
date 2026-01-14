import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Send, 
  Loader2,
  UtensilsCrossed,
  Dumbbell,
  Moon,
  Zap,
  Brain,
  Smile,
  Trophy,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CalendarPlus
} from "lucide-react";
import { useReviewCheckin, type ClientCheckin } from "@/hooks/useCheckins";
import { type CoachClient } from "@/hooks/useCoachClients";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

interface CheckinReviewSheetProps {
  checkin: ClientCheckin | null;
  client: CoachClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckinReviewSheet({ checkin, client, open, onOpenChange }: CheckinReviewSheetProps) {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [nextCheckinDate, setNextCheckinDate] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd")
  );
  const reviewCheckin = useReviewCheckin();

  if (!checkin) return null;

  const handleSubmitReview = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    try {
      await reviewCheckin.mutateAsync({
        checkinId: checkin.id,
        feedback: feedback.trim(),
        rating: rating || undefined,
        nextCheckinDate: nextCheckinDate || undefined,
      });
      toast.success("Review submitted! Client will be notified.");
      setFeedback("");
      setRating(0);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to submit review");
    }
  };

  const isReviewed = checkin.status === "reviewed" || checkin.status === "acknowledged";

  const adherenceItems = [
    { key: "diet_adherence", label: "Diet", icon: UtensilsCrossed, color: "text-orange-500" },
    { key: "workout_adherence", label: "Workout", icon: Dumbbell, color: "text-blue-500" },
    { key: "sleep_quality", label: "Sleep", icon: Moon, color: "text-indigo-500" },
    { key: "energy_level", label: "Energy", icon: Zap, color: "text-yellow-500" },
    { key: "stress_level", label: "Stress", icon: Brain, color: "text-red-500" },
    { key: "mood_rating", label: "Mood", icon: Smile, color: "text-green-500" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={client?.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {client?.profile?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-lg">
                    {client?.profile?.full_name || "Client"}'s Check-in
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(checkin.checkin_date), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </SheetHeader>

            {/* Status */}
            {isReviewed && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm text-success font-medium">
                  Reviewed {checkin.reviewed_at && format(new Date(checkin.reviewed_at), "MMM d 'at' h:mm a")}
                </span>
              </div>
            )}

            {/* Adherence Metrics */}
            <div>
              <h3 className="font-semibold mb-4">Adherence & Wellness</h3>
              <div className="grid grid-cols-2 gap-4">
                {adherenceItems.map(({ key, label, icon: Icon, color }) => {
                  const value = checkin[key as keyof ClientCheckin] as number | null;
                  if (!value) return null;
                  
                  return (
                    <div key={key} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          {label}
                        </span>
                        <span className="font-bold">{value}/10</span>
                      </div>
                      <Progress value={value * 10} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-4">
              {checkin.diet_notes && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    Diet Notes
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {checkin.diet_notes}
                  </p>
                </div>
              )}

              {checkin.workout_notes && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Dumbbell className="w-4 h-4" />
                    Workout Notes
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {checkin.workout_notes}
                  </p>
                </div>
              )}

              {checkin.general_notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">General Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {checkin.general_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Wins & Challenges */}
            {(checkin.wins || checkin.challenges) && (
              <>
                <Separator />
                <div className="grid sm:grid-cols-2 gap-4">
                  {checkin.wins && (
                    <div className="bg-success/10 rounded-lg p-4 border border-success/20">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-success">
                        <Trophy className="w-4 h-4" />
                        Wins
                      </h4>
                      <p className="text-sm">{checkin.wins}</p>
                    </div>
                  )}
                  {checkin.challenges && (
                    <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        Challenges
                      </h4>
                      <p className="text-sm">{checkin.challenges}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Previous Feedback */}
            {checkin.coach_feedback && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Your Feedback
                    {checkin.coach_rating && (
                      <Badge className="ml-2">
                        {checkin.coach_rating}/5 <Star className="w-3 h-3 ml-1 fill-current" />
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm bg-primary/10 rounded-lg p-4 border border-primary/20">
                    {checkin.coach_feedback}
                  </p>
                </div>
              </>
            )}

            {/* Review Form */}
            {!isReviewed && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Submit Review</h3>
                  
                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Rating (optional)</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(rating === star ? 0 : star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= rating 
                                ? "fill-yellow-500 text-yellow-500" 
                                : "text-muted-foreground"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback *</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Provide constructive feedback for your client..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* Next Check-in Date */}
                  <div className="space-y-2">
                    <Label htmlFor="nextCheckin" className="flex items-center gap-2">
                      <CalendarPlus className="w-4 h-4" />
                      Next Check-in Date
                    </Label>
                    <Input
                      id="nextCheckin"
                      type="date"
                      value={nextCheckinDate}
                      onChange={(e) => setNextCheckinDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set when the client should submit their next check-in (defaults to 1 week)
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmitReview}
                    disabled={reviewCheckin.isPending || !feedback.trim()}
                    className="w-full"
                  >
                    {reviewCheckin.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Review
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
