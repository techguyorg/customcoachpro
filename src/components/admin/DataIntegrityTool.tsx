import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Database, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Wrench, ShieldCheck } from "lucide-react";

interface MissingProfile {
  user_id: string;
  email: string;
  created_at: string;
}

interface IntegrityData {
  missingProfiles: MissingProfile[];
  coachesWithoutProfiles: { user_id: string; coach_profile_id: string }[];
  summary: {
    usersMissingProfiles: number;
    coachesMissingBaseProfiles: number;
    totalIssues: number;
  };
}

export function DataIntegrityTool() {
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["data-integrity-missing-profiles"],
    queryFn: async () => {
      return api.get<IntegrityData>("/api/admin/data-integrity/missing-profiles");
    },
  });

  const repairMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      return api.post<{ repairedCount: number; errors: { userId: string; error: string }[] }>(
        "/api/admin/data-integrity/repair-profiles",
        { userIds }
      );
    },
    onSuccess: (result) => {
      toast.success(`Repaired ${result.repairedCount} profiles`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} repairs failed`);
      }
      setSelectedUserIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["data-integrity-missing-profiles"] });
    },
    onError: () => {
      toast.error("Failed to repair profiles");
    },
  });

  const toggleSelection = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const selectAll = () => {
    if (data?.missingProfiles) {
      setSelectedUserIds(new Set(data.missingProfiles.map((p) => p.user_id)));
    }
  };

  const deselectAll = () => {
    setSelectedUserIds(new Set());
  };

  const handleRepair = () => {
    if (selectedUserIds.size === 0) {
      toast.error("Select at least one user to repair");
      return;
    }
    repairMutation.mutate(Array.from(selectedUserIds));
  };

  const hasIssues = data && data.summary.totalIssues > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Integrity
            </CardTitle>
            <CardDescription>
              Scan for and repair missing user profile records
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Scan</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Scan Required</AlertTitle>
            <AlertDescription>
              Click "Scan" to check for data integrity issues.
            </AlertDescription>
          </Alert>
        ) : !hasIssues ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700 dark:text-green-400">All Clear</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-300">
              No missing profiles detected. All users have valid profile records.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Issues Found</AlertTitle>
              <AlertDescription>
                {data.summary.usersMissingProfiles} user(s) are missing profile records.
                {data.summary.coachesMissingBaseProfiles > 0 && (
                  <> {data.summary.coachesMissingBaseProfiles} coach(es) have coach_profiles but no base profile.</>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedUserIds.size} selected</Badge>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
              <Button
                onClick={handleRepair}
                disabled={selectedUserIds.size === 0 || repairMutation.isPending}
                className="gap-2"
              >
                {repairMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                Repair Selected ({selectedUserIds.size})
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <ShieldCheck className="h-4 w-4" />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.missingProfiles.map((profile) => (
                    <TableRow key={profile.user_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.has(profile.user_id)}
                          onCheckedChange={() => toggleSelection(profile.user_id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{profile.email}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {profile.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
