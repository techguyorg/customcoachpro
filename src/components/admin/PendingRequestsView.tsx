import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";

interface Request {
  id: string;
  coach_id: string;
  client_id: string;
  status: string;
  message: string | null;
  created_at: string;
  coach?: { full_name: string; email: string; avatar_url: string | null };
  client?: { full_name: string; email: string; avatar_url: string | null };
}

export function PendingRequestsView() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-pending-requests"],
    queryFn: async () => {
      return api.get<Request[]>('/api/admin/pending-requests');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Coaching Requests"
        description="View all pending coaching requests awaiting response"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            {requests?.length || 0} Pending Requests
          </CardTitle>
          <CardDescription>
            Coaching requests waiting for coach approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Requested Coach</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={req.client?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {req.client?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{req.client?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{req.client?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={req.coach?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {req.coach?.full_name?.charAt(0) || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{req.coach?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{req.coach?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {req.message ? (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">{req.message}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No message</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(req.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending requests</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
