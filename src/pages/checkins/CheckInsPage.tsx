import { useState } from "react";
import { ClipboardCheck, Scale, Camera, Dumbbell, Utensils, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CheckIn {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  type: "weight" | "photos" | "workout" | "diet";
  date: string;
  status: "pending" | "reviewed";
  data: Record<string, unknown>;
}

const mockCheckIns: CheckIn[] = [
  {
    id: "1",
    clientId: "1",
    clientName: "Sarah Johnson",
    type: "weight",
    date: "2024-03-15T10:30:00Z",
    status: "pending",
    data: { weight: 165, bodyFat: 22, waist: 30 },
  },
  {
    id: "2",
    clientId: "2",
    clientName: "Mike Williams",
    type: "workout",
    date: "2024-03-15T09:15:00Z",
    status: "pending",
    data: { completed: true, notes: "Felt strong today!" },
  },
  {
    id: "3",
    clientId: "3",
    clientName: "Emily Davis",
    type: "diet",
    date: "2024-03-14T20:00:00Z",
    status: "pending",
    data: { complianceRating: 8, deviations: "Had a small dessert after dinner" },
  },
  {
    id: "4",
    clientId: "1",
    clientName: "Sarah Johnson",
    type: "photos",
    date: "2024-03-10T14:00:00Z",
    status: "reviewed",
    data: { front: "url", side: "url", back: "url" },
  },
];

const typeIcons = {
  weight: Scale,
  photos: Camera,
  workout: Dumbbell,
  diet: Utensils,
};

const typeLabels = {
  weight: "Weight & Measurements",
  photos: "Progress Photos",
  workout: "Workout Completion",
  diet: "Diet Compliance",
};

export function CheckInsPage() {
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [checkIns] = useState<CheckIn[]>(mockCheckIns);

  const pendingCheckIns = checkIns.filter((c) => c.status === "pending");
  const reviewedCheckIns = checkIns.filter((c) => c.status === "reviewed");

  const CheckInCard = ({ checkIn }: { checkIn: CheckIn }) => {
    const Icon = typeIcons[checkIn.type];

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCheckIn(checkIn)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{typeLabels[checkIn.type]}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={checkIn.clientAvatar} />
                    <AvatarFallback className="text-[10px]">
                      {checkIn.clientName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{checkIn.clientName}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className={checkIn.status === "pending" ? "bg-energy/20 text-energy border-0" : "bg-vitality/20 text-vitality border-0"}>
                {checkIn.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{new Date(checkIn.date).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCheckInDetails = () => {
    if (!selectedCheckIn) return null;

    switch (selectedCheckIn.type) {
      case "weight":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="text-2xl font-bold">{String(selectedCheckIn.data.weight)} lbs</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Body Fat</p>
                <p className="text-2xl font-bold">{String(selectedCheckIn.data.bodyFat)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Waist</p>
                <p className="text-2xl font-bold">{String(selectedCheckIn.data.waist)}"</p>
              </div>
            </div>
          </div>
        );
      case "workout":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge className={selectedCheckIn.data.completed ? "bg-vitality/20 text-vitality" : "bg-destructive/20 text-destructive"}>
                {selectedCheckIn.data.completed ? "Completed" : "Not Completed"}
              </Badge>
            </div>
            {selectedCheckIn.data.notes && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p>{String(selectedCheckIn.data.notes)}</p>
              </div>
            )}
          </div>
        );
      case "diet":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-sm text-muted-foreground">Compliance Rating</p>
              <p className="text-4xl font-bold text-primary">{String(selectedCheckIn.data.complianceRating)}/10</p>
            </div>
            {selectedCheckIn.data.deviations && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Deviations</p>
                <p>{String(selectedCheckIn.data.deviations)}</p>
              </div>
            )}
          </div>
        );
      case "photos":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Check-ins"
        description="Review and manage client check-ins"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-energy border-energy">
              {pendingCheckIns.length} pending
            </Badge>
          </div>
        }
      />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending ({pendingCheckIns.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reviewed ({reviewedCheckIns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingCheckIns.map((checkIn) => (
              <CheckInCard key={checkIn.id} checkIn={checkIn} />
            ))}
          </div>
          {pendingCheckIns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No pending check-ins. You're all caught up!</div>
          )}
        </TabsContent>

        <TabsContent value="reviewed">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviewedCheckIns.map((checkIn) => (
              <CheckInCard key={checkIn.id} checkIn={checkIn} />
            ))}
          </div>
          {reviewedCheckIns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No reviewed check-ins yet.</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCheckIn} onOpenChange={() => setSelectedCheckIn(null)}>
        <DialogContent className="max-w-lg">
          {selectedCheckIn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[selectedCheckIn.type];
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  {typeLabels[selectedCheckIn.type]}
                </DialogTitle>
                <DialogDescription>Submitted by {selectedCheckIn.clientName} on {new Date(selectedCheckIn.date).toLocaleDateString()}</DialogDescription>
              </DialogHeader>

              {renderCheckInDetails()}

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedCheckIn(null)}>
                  Close
                </Button>
                {selectedCheckIn.status === "pending" && (
                  <Button className="shadow-energy">Mark as Reviewed</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CheckInsPage;
