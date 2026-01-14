import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Message } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<Conversation[]>('/api/messages/conversations');
    },
    enabled: !!user?.id,
    // Poll every 30 seconds for new messages
    refetchInterval: 30000,
  });
}

export function useMessages(partnerId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["messages", user?.id, partnerId],
    queryFn: async () => {
      if (!user?.id || !partnerId) return [];
      return api.get<Message[]>(`/api/messages/${partnerId}`);
    },
    enabled: !!user?.id && !!partnerId,
    refetchInterval: 10000, // Poll every 10 seconds when viewing a conversation
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientId,
      content,
    }: {
      recipientId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      // Backend expects recipient_id (snake_case)
      return api.post('/api/messages', { recipient_id: recipientId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      return api.post('/api/messages/mark-read', { messageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useTotalUnreadCount() {
  const { data: conversations } = useConversations();
  return conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;
}
