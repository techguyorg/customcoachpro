import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachingRequestWithClient {
  id: string;
  client_id: string;
  coach_id: string;
  status: string;
  message: string | null;
  coach_response: string | null;
  created_at: string;
  responded_at: string | null;
  // Flat fields from backend
  client_name?: string;
  client_email?: string;
  client_avatar?: string | null;
  fitness_level?: string;
  fitness_goals?: string[];
  // Legacy nested format
  client_profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useCoachRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coach-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return api.get<CoachingRequestWithClient[]>('/api/coach/requests');
    },
    enabled: !!user,
  });
}

export function usePendingRequestsCount() {
  const { data: requests } = useCoachRequests();
  return requests?.filter((r) => r.status === "pending").length || 0;
}

export function useRespondToRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      response,
    }: {
      requestId: string;
      status: "accepted" | "declined";
      response?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      // Backend expects 'action' with 'accept'/'decline' and 'response_message'
      const action = status === "accepted" ? "accept" : "decline";
      return api.post(`/api/coach/requests/${requestId}/respond`, { action, response_message: response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-requests"] });
      queryClient.invalidateQueries({ queryKey: ["coach-clients"] });
    },
  });
}
