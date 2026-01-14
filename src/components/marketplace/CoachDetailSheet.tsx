import { useState } from "react";
import { Star, MapPin, Users, Clock, Award, MessageSquare, Loader2, Check, X, Mail, Phone, Briefcase } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { CoachProfile } from "@/hooks/useCoachMarketplace";
import { useSendCoachingRequest, useCoachingRequests } from "@/hooks/useCoachMarketplace";

interface CoachDetailSheetProps {
  coach: CoachProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachDetailSheet({ coach, open, onOpenChange }: CoachDetailSheetProps) {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const sendRequest = useSendCoachingRequest();
  const { data: existingRequests } = useCoachingRequests();

  if (!coach) return null;

  const hasExistingRequest = existingRequests?.some(
    (r) => r.coach_id === coach.user_id && r.status === "pending"
  );

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSendRequest = async () => {
    try {
      await sendRequest.mutateAsync({
        coachId: coach.user_id,
        message: message.trim() || undefined,
      });
      toast({ title: "Request sent!", description: "The coach will review your request." });
      setRequestDialogOpen(false);
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const initials = coach.profile?.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "C";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="sr-only">Coach Profile</SheetTitle>
          </SheetHeader>

          {/* Profile Header */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-border">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={coach.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-xl font-bold">{coach.profile?.full_name || "Coach"}</h2>
            
            {coach.rating ? (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="font-medium">{coach.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({coach.total_reviews || 0} reviews)
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground mt-2">New coach</span>
            )}

            {coach.is_accepting_clients ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 mt-3">
                Accepting Clients
              </Badge>
            ) : (
              <Badge variant="secondary" className="mt-3">Not Accepting Clients</Badge>
            )}
          </div>

          {/* Bio */}
          {coach.profile?.bio && (
            <div className="py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">About</h3>
              <p className="text-sm">{coach.profile.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="py-4 border-b border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{coach.experience_years || 0}</p>
                <p className="text-xs text-muted-foreground">Years Exp.</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{coach.client_count || 0}</p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{coach.certifications?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Certs</p>
              </div>
            </div>
          </div>

          {/* Specializations */}
          {coach.specializations && coach.specializations.length > 0 && (
            <div className="py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {coach.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {coach.certifications && coach.certifications.length > 0 && (
            <div className="py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {coach.certifications.map((cert) => (
                  <Badge key={cert} variant="outline" className="text-xs">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pricing</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(coach.hourly_rate, coach.currency)}
              {coach.hourly_rate && <span className="text-sm font-normal text-muted-foreground">/month</span>}
            </p>
          </div>

          {/* Action Button */}
          <div className="py-6">
            {hasExistingRequest ? (
              <Button variant="outline" className="w-full" disabled>
                <Check className="w-4 h-4 mr-2" />
                Request Sent
              </Button>
            ) : (
              <Button 
                className="w-full" 
                disabled={!coach.is_accepting_clients}
                onClick={() => setRequestDialogOpen(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Coaching
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Coaching from {coach.profile?.full_name}</DialogTitle>
            <DialogDescription>
              Send a message to introduce yourself and explain your fitness goals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="request-message">Your Message (optional)</Label>
              <Textarea
                id="request-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'm interested in working with you. My goals are..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
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
    </>
  );
}
