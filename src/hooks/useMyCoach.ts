import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface MyCoachInfo {
  coachId: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  email: string;
  specializations: string[] | null;
  rating: number | null;
  experienceYears: number | null;
}

export function useMyCoach() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-coach", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await api.get<MyCoachInfo | null>('/api/client/my-coach');
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
  });
}

export function useEndCoachingRelationship() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.post('/api/client/end-coaching', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-coach"] });
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
    },
  });
}
