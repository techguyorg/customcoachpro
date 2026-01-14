import { useState } from "react";
import { Star, MapPin, Users, Clock, Award, MessageSquare, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { CoachProfile } from "@/hooks/useCoachMarketplace";
import { useSendCoachingRequest, useCoachingRequests } from "@/hooks/useCoachMarketplace";

interface CoachCardProps {
  coach: CoachProfile;
  onClick?: () => void;
}

export function CoachCard({ coach, onClick }: CoachCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const sendRequest = useSendCoachingRequest();
  const { data: existingRequests } = useCoachingRequests();

  const hasExistingRequest = existingRequests?.some(
    (r) => r.coach_id === coach.user_id && r.status === "pending"
  );

  const handleSendRequest = async () => {
    try {
      await sendRequest.mutateAsync({
        coachId: coach.user_id,
        message: message.trim() || undefined,
      });
      toast({ title: "Request sent!", description: "The coach will review your request." });
      setDialogOpen(false);
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card 
      className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarImage src={coach.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {coach.profile?.full_name?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-base truncate">
                  {coach.profile?.full_name || "Unknown Coach"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {coach.rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span className="font-medium">{coach.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({coach.total_reviews || 0} reviews)
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">New coach</span>
                  )}
                </div>
              </div>

              {coach.is_accepting_clients ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  Accepting Clients
                </Badge>
              ) : (
                <Badge variant="secondary">Not Available</Badge>
              )}
            </div>

            {/* Bio */}
            {coach.profile?.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {coach.profile.bio}
              </p>
            )}

            {/* Specializations */}
            {coach.specializations && coach.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {coach.specializations.slice(0, 4).map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {coach.specializations.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{coach.specializations.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              {coach.experience_years && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {coach.experience_years}+ years
                </div>
              )}
              {coach.client_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {coach.client_count} clients
                </div>
              )}
              {coach.certifications && coach.certifications.length > 0 && (
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {coach.certifications.length} certifications
                </div>
              )}
            </div>

            {/* Price and Action */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                <span className="text-lg font-bold">
                  {formatCurrency(coach.hourly_rate, coach.currency)}
                </span>
                {coach.hourly_rate && (
                  <span className="text-sm text-muted-foreground">/month</span>
                )}
              </div>

              {hasExistingRequest ? (
                <Button variant="outline" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Request Sent
                </Button>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!coach.is_accepting_clients}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Request Coaching
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Coaching from {coach.profile?.full_name}</DialogTitle>
                      <DialogDescription>
                        Send a message to introduce yourself and explain your fitness goals.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="message">Your Message (optional)</Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Hi! I'm interested in working with you. My goals are..."
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendRequest} disabled={sendRequest.isPending}>
                          {sendRequest.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Request"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
