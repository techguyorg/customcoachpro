import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppRole } from "@/lib/auth";
import { toast } from "sonner";
import { ensureArray } from "@/lib/utils";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
}

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const users = await api.get<AdminUser[]>('/api/admin/users');
      // Ensure roles is always an array (Azure SQL returns comma-separated string)
      return users.map(user => ({
        ...user,
        roles: ensureArray<AppRole>(user.roles as unknown as string | AppRole[])
      }));
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      return api.post('/api/admin/users/roles', { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role added successfully");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate") || error.message.includes("already")) {
        toast.error("User already has this role");
      } else {
        toast.error("Failed to add role");
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      return api.delete(`/api/admin/users/${userId}/roles/${role}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove role");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete user error:", error);
      toast.error("Failed to delete user. They may have related data.");
    },
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    addRole: addRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isAddingRole: addRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending,
  };
}
