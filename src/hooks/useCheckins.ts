import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CheckinTemplate {
  id: string;
  coach_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  frequency_days: number;
  required_fields: Record<string, boolean> & {
    weight?: boolean;
    measurements?: boolean;
    photos?: boolean;
    diet_adherence?: boolean;
    workout_adherence?: boolean;
    sleep_quality?: boolean;
    energy_level?: boolean;
    stress_level?: boolean;
    notes?: boolean;
  };
  is_active: boolean;
  created_at: string;
}

export interface ClientCheckin {
  id: string;
  client_id: string;
  coach_id: string | null;
  template_id: string | null;
  checkin_date: string;
  period_start: string | null;
  period_end: string | null;
  measurement_id: string | null;
  diet_adherence: number | null;
  workout_adherence: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  stress_level: number | null;
  mood_rating: number | null;
  diet_notes: string | null;
  workout_notes: string | null;
  general_notes: string | null;
  wins: string | null;
  challenges: string | null;
  photo_ids: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'acknowledged';
  submitted_at: string | null;
  coach_feedback: string | null;
  coach_rating: number | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export type CheckinInput = Partial<Omit<ClientCheckin, 'id' | 'client_id' | 'created_at'>>;

// Client hooks

export function useMyCheckins() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-checkins", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<ClientCheckin[]>('/api/checkins/my');
    },
    enabled: !!user?.id,
  });
}

export function useSubmitCheckin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (checkin: CheckinInput) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.post<ClientCheckin>('/api/checkins', checkin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-checkins", user?.id] });
    },
  });
}

export function useSaveCheckinDraft() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...checkin }: CheckinInput & { id?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (id) {
        return api.put<ClientCheckin>(`/api/checkins/${id}/draft`, checkin);
      } else {
        return api.post<ClientCheckin>('/api/checkins/draft', checkin);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-checkins", user?.id] });
    },
  });
}

// Coach hooks

export function useCoachCheckins() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coach-checkins", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<ClientCheckin[]>('/api/checkins/coach');
    },
    enabled: !!user?.id,
  });
}

export function usePendingCheckins() {
  const { data: checkins } = useCoachCheckins();
  return checkins?.filter(c => c.status === "submitted") || [];
}

export function useReviewCheckin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      checkinId, 
      feedback, 
      rating,
      nextCheckinDate
    }: { 
      checkinId: string; 
      feedback: string; 
      rating?: number;
      nextCheckinDate?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.post<ClientCheckin>(`/api/checkins/${checkinId}/review`, {
        feedback,
        rating,
        nextCheckinDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-checkins", user?.id] });
    },
  });
}

// Check-in templates

export function useCheckinTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["checkin-templates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<CheckinTemplate[]>('/api/checkins/templates');
    },
    enabled: !!user?.id,
  });
}

export function useCreateCheckinTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Partial<CheckinTemplate>) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.post<CheckinTemplate>('/api/checkins/templates', template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkin-templates", user?.id] });
    },
  });
}

export function useClientCheckinTemplate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-checkin-template", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await api.get<CheckinTemplate | null>('/api/checkins/my-template');
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
  });
}
