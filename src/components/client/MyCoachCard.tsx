import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare, UserX, Users, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCoach, useEndCoachingRelationship } from "@/hooks/useMyCoach";
import { toast } from "sonner";

export function MyCoachCard() {
  const { data: coach, isLoading } = useMyCoach();
  const endRelationship = useEndCoachingRelationship();
  const [showEndDialog, setShowEndDialog] = useState(false);

  const handleEndCoaching = async () => {
    try {
      await endRelationship.mutateAsync();
      toast.success("Coaching relationship ended");
      setShowEndDialog(false);
    } catch (error) {
      toast.error("Failed to end coaching relationship");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!coach) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            You don't have a coach yet. Get personalized guidance from a certified fitness professional.
          </p>
          <Link to="/client/coaches">
            <Button variant="outline" size="sm" className="w-full">
              Find a Coach
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const initials = coach.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "C";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          My Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={coach.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{coach.fullName}</p>
            {coach.rating && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-3 h-3 fill-warning text-warning" />
                {coach.rating.toFixed(1)}
                {coach.experienceYears && (
                  <span className="ml-2">• {coach.experienceYears}+ years</span>
                )}
              </div>
            )}
          </div>
        </div>

        {coach.specializations && coach.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {coach.specializations.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link to="/client/messages" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
          </Link>
          
          <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <UserX className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Coaching Relationship?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to end your coaching relationship with {coach.fullName}? 
                  This will remove them as your coach. You can always find a new coach later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleEndCoaching}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  End Coaching
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
