import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Loader2, Search, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";

interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_resource_type: string | null;
  target_resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin_profile?: {
    full_name: string;
    email: string;
  };
  target_profile?: {
    full_name: string;
    email: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  super_admin_granted: "bg-green-500/10 text-green-600 border-green-500/20",
  super_admin_revoked: "bg-red-500/10 text-red-600 border-red-500/20",
  user_deleted: "bg-red-500/10 text-red-600 border-red-500/20",
  role_added: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  role_removed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  content_created: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  content_updated: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  content_deleted: "bg-red-500/10 text-red-600 border-red-500/20",
  impersonation_started: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  impersonation_ended: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const formatActionType = (action: string) =>
  action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export function AuditLogViewer() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", dateFilter],
    queryFn: async (): Promise<AuditLog[]> => {
      const data = await api.get<AuditLog[]>(`/api/admin/audit-logs?limit=500`);
      return data;
    },
  });

  const actionTypes = [...new Set((logs || []).map((l) => l.action_type))];

  const filteredLogs = (logs || []).filter((log) => {
    const matchesSearch =
      log.admin_profile?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_profile?.email.toLowerCase().includes(search.toLowerCase()) ||
      log.target_profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.target_profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.action_type.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Track all admin actions on the platform</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by admin, target, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatActionType(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} log entries
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No audit logs found for the selected period
          </div>
        ) : (
          <ScrollArea className="h-[500px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{log.admin_profile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{log.admin_profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ACTION_COLORS[log.action_type] || "bg-gray-500/10 text-gray-600"}
                      >
                        {formatActionType(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.target_profile ? (
                        <div className="text-sm">
                          <p className="font-medium">{log.target_profile.full_name}</p>
                          <p className="text-xs text-muted-foreground">{log.target_profile.email}</p>
                        </div>
                      ) : log.target_resource_type ? (
                        <span className="text-sm text-muted-foreground">
                          {log.target_resource_type}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {log.details && typeof log.details === 'object' && !Array.isArray(log.details) && Object.keys(log.details).length > 0 ? (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {Object.entries(log.details as Record<string, unknown>).map(([key, value]) => (
                            <p key={key} className="truncate">
                              <span className="font-medium">{key.replace(/_/g, " ")}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
