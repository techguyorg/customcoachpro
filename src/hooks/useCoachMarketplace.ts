import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachProfile {
  id: string;
  user_id: string;
  specializations: string[] | null;
  certifications: string[] | null;
  experience_years: number | null;
  hourly_rate: number | null;
  currency: string | null;
  rating: number | null;
  total_reviews: number | null;
  is_accepting_clients: boolean | null;
  max_clients: number | null;
  profile: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
  client_count?: number;
}

export interface CoachFilters {
  search: string;
  specialization: string;
  minRating: number;
  maxRate: number | null;
  acceptingOnly: boolean;
}

export function useCoachMarketplace(filters: CoachFilters, excludeCurrentCoach = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coach-marketplace", filters, user?.id, excludeCurrentCoach],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.specialization && filters.specialization !== 'all') params.append('specialization', filters.specialization);
      if (filters.minRating > 0) params.append('minRating', filters.minRating.toString());
      if (filters.maxRate) params.append('maxRate', filters.maxRate.toString());
      if (filters.acceptingOnly) params.append('acceptingOnly', 'true');
      if (excludeCurrentCoach) params.append('excludeCurrentCoach', 'true');

      return api.get<CoachProfile[]>(`/api/coach/marketplace?${params.toString()}`);
    },
  });
}

export function useCoachingRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coaching-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return api.get<any[]>('/api/coach/requests/my');
    },
    enabled: !!user,
  });
}

export function useSendCoachingRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      coachId,
      message,
    }: {
      coachId: string;
      message?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      return api.post('/api/coach/requests', { coachId, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-requests"] });
    },
  });
}

export function useCancelCoachingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      return api.put(`/api/coach/requests/${requestId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-requests"] });
    },
  });
}

// Get all unique specializations for filter dropdown
export function useSpecializations() {
  return useQuery({
    queryKey: ["coach-specializations"],
    queryFn: async () => {
      return api.get<string[]>('/api/coach/specializations');
    },
  });
}
