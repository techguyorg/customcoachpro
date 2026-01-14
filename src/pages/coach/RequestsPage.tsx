import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Clock, MessageSquare, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useCoachRequests,
  useRespondToRequest,
  type CoachingRequestWithClient,
} from "@/hooks/useCoachRequests";

export default function CoachRequestsPage() {
  const { data: requests, isLoading } = useCoachRequests();
  const [selectedRequest, setSelectedRequest] = useState<CoachingRequestWithClient | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseAction, setResponseAction] = useState<"accepted" | "declined">("accepted");
  const [responseMessage, setResponseMessage] = useState("");
  const respondToRequest = useRespondToRequest();
  const { toast } = useToast();

  const pendingRequests = requests?.filter((r) => r.status === "pending") || [];
  const acceptedRequests = requests?.filter((r) => r.status === "accepted") || [];
  const declinedRequests = requests?.filter((r) => r.status === "declined") || [];

  const handleRespond = async () => {
    if (!selectedRequest) return;

    try {
      await respondToRequest.mutateAsync({
        requestId: selectedRequest.id,
        status: responseAction,
        response: responseMessage.trim() || undefined,
      });
      toast({
        title: responseAction === "accepted" ? "Request accepted!" : "Request declined",
        description:
          responseAction === "accepted"
            ? "The client has been added to your roster."
            : "The client has been notified.",
      });
      setResponseDialogOpen(false);
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to respond",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openResponseDialog = (
    request: CoachingRequestWithClient,
    action: "accepted" | "declined"
  ) => {
    setSelectedRequest(request);
    setResponseAction(action);
    setResponseDialogOpen(true);
  };

  // Helper to get client info from either flat or nested format
  const getClientName = (request: CoachingRequestWithClient) => 
    request.client_name || request.client_profile?.full_name || "Unknown Client";
  const getClientEmail = (request: CoachingRequestWithClient) =>
    request.client_email || request.client_profile?.email;
  const getClientAvatar = (request: CoachingRequestWithClient) =>
    request.client_avatar || request.client_profile?.avatar_url;

  const renderRequestCard = (request: CoachingRequestWithClient, showActions = false) => (
    <Card key={request.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={getClientAvatar(request) || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {getClientName(request)?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold">
                  {getClientName(request)}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {getClientEmail(request)}
                </p>
              </div>
              <Badge
                variant={
                  request.status === "pending"
                    ? "secondary"
                    : request.status === "accepted"
                    ? "default"
                    : "destructive"
                }
              >
                {request.status}
              </Badge>
            </div>

            {request.message && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {request.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Requested {format(new Date(request.created_at), "MMM d, yyyy")}
              </span>
              {request.responded_at && (
                <span>
                  Responded {format(new Date(request.responded_at), "MMM d, yyyy")}
                </span>
              )}
            </div>

            {showActions && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => openResponseDialog(request, "accepted")}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openResponseDialog(request, "declined")}
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {request.coach_response && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Your response:</span>{" "}
                  {request.coach_response}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <User className="w-7 h-7 text-primary" />
          Coaching Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage requests from clients who want to work with you
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((request) => renderRequestCard(request, true))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No pending requests</h3>
                <p className="text-muted-foreground mt-1">
                  New coaching requests will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedRequests.length > 0 ? (
            acceptedRequests.map((request) => renderRequestCard(request))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No accepted requests yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="declined" className="space-y-4">
          {declinedRequests.length > 0 ? (
            declinedRequests.map((request) => renderRequestCard(request))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No declined requests
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === "accepted" ? "Accept Request" : "Decline Request"}
            </DialogTitle>
            <DialogDescription>
              {responseAction === "accepted"
                ? `Accept ${selectedRequest?.client_name || selectedRequest?.client_profile?.full_name}'s request to become your client?`
                : `Decline ${selectedRequest?.client_name || selectedRequest?.client_profile?.full_name}'s request?`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="response">
                Message to client (optional)
              </Label>
              <Textarea
                id="response"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder={
                  responseAction === "accepted"
                    ? "Welcome! I'm excited to work with you..."
                    : "Unfortunately I'm not able to take on new clients at this time..."
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={responseAction === "accepted" ? "default" : "destructive"}
                onClick={handleRespond}
                disabled={respondToRequest.isPending}
              >
                {respondToRequest.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : responseAction === "accepted" ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Accept Client
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
