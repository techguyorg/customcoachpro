import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface SuperAdmin {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export function SuperAdminManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const { data: superAdmins, isLoading } = useQuery({
    queryKey: ["super-admins"],
    queryFn: async (): Promise<SuperAdmin[]> => {
      const data = await api.get<SuperAdmin[]>('/api/admin/super-admins');
      return data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      await api.post('/api/admin/super-admins', { email: targetEmail });
    },
    onSuccess: () => {
      toast.success("Super admin role assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["super-admins"] });
      setEmail("");
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign super admin role");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (admin: SuperAdmin) => {
      await api.delete(`/api/admin/super-admins/${admin.user_id}`);
    },
    onSuccess: () => {
      toast.success("Super admin role revoked");
      queryClient.invalidateQueries({ queryKey: ["super-admins"] });
      setConfirmRevoke(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to revoke super admin role");
    },
  });

  const handleAssign = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    assignMutation.mutate(email.trim());
  };

  const handleRevoke = (admin: SuperAdmin) => {
    if (admin.email === user?.email) {
      toast.error("You cannot revoke your own super admin role");
      return;
    }
    revokeMutation.mutate(admin);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Super Admin Management
              </CardTitle>
              <CardDescription>
                Manage platform super administrators with full system access
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Super Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Super Admin</DialogTitle>
                  <DialogDescription>
                    Enter the email of an existing user to grant them super admin access.
                    The user must have already signed up on the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">User Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                    {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Assign Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : superAdmins && superAdmins.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Assigned Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {superAdmins.map((admin) => (
                  <TableRow key={admin.user_id}>
                    <TableCell className="font-medium">
                      <div>
                        {admin.full_name}
                        {admin.email === user?.email && (
                          <Badge variant="secondary" className="text-xs ml-2">You</Badge>
                        )}
                        <p className="text-xs text-muted-foreground sm:hidden">{admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(admin.created_at), "PPP")}</TableCell>
                    <TableCell>
                      {admin.email !== user?.email ? (
                        confirmRevoke === admin.email ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevoke(admin)}
                              disabled={revokeMutation.isPending}
                            >
                              {revokeMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmRevoke(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmRevoke(admin.email)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No super admins found
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 dark:text-amber-400 space-y-2">
          <p>
            Super administrators have full access to all platform data and settings. Only grant this
            role to trusted team members.
          </p>
          <p>
            All super admin actions are logged for audit purposes. Email notifications are sent when access is granted or revoked.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
