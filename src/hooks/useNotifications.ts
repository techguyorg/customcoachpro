import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Notification as ApiNotification } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useState, useEffect } from "react";

export type { Notification } from "@/lib/api";

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<ApiNotification[]>('/api/notifications');
    },
    enabled: !!user?.id,
    // Poll every 30 seconds for new notifications
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.is_read).length || 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return api.put(`/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      return api.post('/api/notifications/mark-all-read', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useRealtimeNotifications(): { newNotification: ApiNotification | null; clearNewNotification: () => void } {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newNotification, setNewNotification] = useState<ApiNotification | null>(null);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  // For Azure, we use polling instead of realtime subscriptions
  // The useNotifications hook already polls every 30 seconds
  useEffect(() => {
    // In Azure mode, we rely on polling in useNotifications
    // This hook is kept for API compatibility
  }, [user?.id, queryClient]);

  return { newNotification, clearNewNotification };
}
