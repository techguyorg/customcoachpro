import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachClient {
  id: string;
  client_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  profile: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  client_profile: {
    height_cm: number | null;
    current_weight_kg: number | null;
    target_weight_kg: number | null;
    fitness_level: string | null;
    fitness_goals: string[] | null;
    dietary_restrictions: string[] | null;
    medical_conditions: string | null;
    subscription_status: string | null;
  } | null;
}

export function useCoachClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coach-clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<CoachClient[]>('/api/coach/clients');
    },
    enabled: !!user?.id,
  });
}

export function useUpdateClientStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ relationshipId, status }: { relationshipId: string; status: string }) => {
      return api.put(`/api/coach/clients/${relationshipId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-clients", user?.id] });
    },
  });
}

export interface ClientInvitation {
  email: string;
  name: string;
  message?: string;
}

export function useInviteClient() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invitation: ClientInvitation) => {
      return api.post('/api/coach/invite', invitation);
    },
  });
}

export function useClientStats() {
  const { data: clients } = useCoachClients();

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter(c => c.status === "active").length || 0,
    pending: clients?.filter(c => c.status === "pending").length || 0,
    paused: clients?.filter(c => c.status === "paused").length || 0,
  };

  return stats;
}
