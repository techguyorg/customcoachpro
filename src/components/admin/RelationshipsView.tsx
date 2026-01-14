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
import { Loader2, Handshake } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";

interface Relationship {
  id: string;
  coach_id: string;
  client_id: string;
  status: string;
  started_at: string | null;
  created_at: string;
  coach?: { full_name: string; email: string; avatar_url: string | null };
  client?: { full_name: string; email: string; avatar_url: string | null };
}

export function RelationshipsView() {
  const { data: relationships, isLoading } = useQuery({
    queryKey: ["admin-relationships"],
    queryFn: async () => {
      return api.get<Relationship[]>('/api/admin/relationships');
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
        title="Active Coach-Client Relationships"
        description="View all active coaching relationships on the platform"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-purple-500" />
            {relationships?.length || 0} Active Relationships
          </CardTitle>
          <CardDescription>
            All currently active coaching engagements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relationships && relationships.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationships.map((rel) => (
                    <TableRow key={rel.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={rel.coach?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {rel.coach?.full_name?.charAt(0) || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{rel.coach?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{rel.coach?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={rel.client?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {rel.client?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{rel.client?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{rel.client?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {rel.started_at 
                          ? format(new Date(rel.started_at), "MMM d, yyyy")
                          : format(new Date(rel.created_at), "MMM d, yyyy")
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Handshake className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active relationships found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
