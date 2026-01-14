import { useState, useEffect } from "react";
import { AdminUser, useAdminUsers } from "@/hooks/useAdminUsers";
import { AppRole } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Search, Shield, UserPlus, Eye, Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";

interface UserManagementTableProps {
  onImpersonate?: (user: AdminUser) => void;
  initialRoleFilter?: string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
  coach: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  client: "bg-green-500/10 text-green-500 border-green-500/20",
};

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  coach: "Coach",
  client: "Client",
};

export function UserManagementTable({ onImpersonate, initialRoleFilter = "all" }: UserManagementTableProps) {
  const { user: currentUser } = useAuth();
  const { users, isLoading, addRole, removeRole, deleteUser, isAddingRole, isRemovingRole, isDeletingUser } = useAdminUsers();
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(initialRoleFilter);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [roleToRemove, setRoleToRemove] = useState<{ user: AdminUser; role: AppRole } | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date" | "roles">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    console.log("ADMIN USERS RAW:", users);
  }, [users]);

  useEffect(() => {
    if (initialRoleFilter && initialRoleFilter !== "all") {
      setRoleFilter(initialRoleFilter);
    }
  }, [initialRoleFilter]);

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole =
        roleFilter === "all" ||
        user.roles.includes(roleFilter as AppRole);

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.full_name.localeCompare(b.full_name);
      } else if (sortBy === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "roles") {
        cmp = b.roles.length - a.roles.length;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.user_id);
      setUserToDelete(null);
    }
  };

  const handleRemoveRole = () => {
    if (roleToRemove) {
      removeRole({ userId: roleToRemove.user.user_id, role: roleToRemove.role });
      setRoleToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User "{userToDelete?.full_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user's profile and all associated data including their roles, measurements, and check-ins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Role Confirmation Dialog */}
      <AlertDialog open={!!roleToRemove} onOpenChange={(open) => !open && setRoleToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {roleToRemove && ROLE_LABELS[roleToRemove.role]} role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the <strong>{roleToRemove && ROLE_LABELS[roleToRemove.role]}</strong> role from <strong>{roleToRemove?.user.full_name}</strong>? 
              This action will revoke their access to related features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveRole} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isRemovingRole}
            >
              {isRemovingRole ? "Removing..." : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admins</SelectItem>
            <SelectItem value="coach">Coaches</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
          </SelectContent>
        </Select>
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
          const [field, order] = v.split("-") as ["name" | "date" | "roles", "asc" | "desc"];
          setSortBy(field);
          setSortOrder(order);
        }}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="roles-desc">Most Roles</SelectItem>
            <SelectItem value="roles-asc">Fewest Roles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
        {roleFilter !== "all" && (
          <span className="ml-2">
            (filtered by: <Badge variant="outline" className="ml-1">{ROLE_LABELS[roleFilter as AppRole] || roleFilter}</Badge>)
          </span>
        )}
      </div>

      {/* Table with horizontal scroll for mobile */}
      <div className="border border-border rounded-lg overflow-x-auto -mx-4 sm:mx-0">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const initials = user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              
              const isCurrentUser = user.user_id === currentUser?.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {user.full_name}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">(you)</span>
                          )}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`text-xs ${ROLE_COLORS[role]}`}
                        >
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-xs text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {!isCurrentUser && onImpersonate && (user.roles.includes("coach") || user.roles.includes("client")) && (
                          <DropdownMenuItem onClick={() => onImpersonate(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View as User
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Add Role
                        </DropdownMenuLabel>
                        {(["super_admin", "coach", "client"] as AppRole[])
                          .filter((role) => !user.roles.includes(role))
                          .map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => addRole({ userId: user.user_id, role })}
                              disabled={isAddingRole}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add {ROLE_LABELS[role]}
                            </DropdownMenuItem>
                          ))}
                        
                        {user.roles.length > 0 && !isCurrentUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                              Remove Role
                            </DropdownMenuLabel>
                            {user.roles.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => setRoleToRemove({ user, role })}
                                disabled={isRemovingRole}
                                className="text-destructive focus:text-destructive"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Remove {ROLE_LABELS[role]}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}

                        {!isCurrentUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setUserToDelete(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
