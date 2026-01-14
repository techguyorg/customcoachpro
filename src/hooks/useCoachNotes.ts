import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachNote {
  id: string;
  coach_id: string;
  client_id: string;
  title: string | null;
  content: string;
  note_type: 'general' | 'call_notes' | 'observation' | 'reminder' | 'milestone' | 'concern';
  tags: string[];
  is_pinned: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reference_date: string | null;
  created_at: string;
  updated_at: string;
}

export type NoteInput = Omit<CoachNote, 'id' | 'coach_id' | 'created_at' | 'updated_at'>;

export function useClientNotes(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coach-notes", clientId],
    queryFn: async () => {
      if (!user?.id || !clientId) return [];
      return api.get<CoachNote[]>(`/api/coach/clients/${clientId}/notes`);
    },
    enabled: !!user?.id && !!clientId,
  });
}

export function useAllNotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-coach-notes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return api.get<CoachNote[]>('/api/coach/notes');
    },
    enabled: !!user?.id,
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (note: NoteInput) => {
      if (!user?.id) throw new Error("Not authenticated");
      return api.post<CoachNote>('/api/coach/notes', note);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coach-notes", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["all-coach-notes", user?.id] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CoachNote> & { id: string }) => {
      return api.put<CoachNote>(`/api/coach/notes/${id}`, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coach-notes", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["all-coach-notes", user?.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      await api.delete(`/api/coach/notes/${id}`);
      return { clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coach-notes", data.clientId] });
      queryClient.invalidateQueries({ queryKey: ["all-coach-notes", user?.id] });
    },
  });
}

export function useTogglePinNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return api.put<CoachNote>(`/api/coach/notes/${id}`, { is_pinned: !isPinned });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coach-notes", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["all-coach-notes", user?.id] });
    },
  });
}
