import { API_ENDPOINTS } from "@/config/api";
import apiService from "./api";
import type { ClientNote } from "@/types";

export type CreateClientNotePayload = {
  content: string;
  pinned?: boolean;
  needsAttention?: boolean;
};

export type UpdateClientNotePayload = Partial<CreateClientNotePayload>;

const clientNotesService = {
  list(clientId: string): Promise<ClientNote[]> {
    return apiService.get<ClientNote[]>(API_ENDPOINTS.clientNotes.byClient(clientId));
  },

  create(clientId: string, payload: CreateClientNotePayload): Promise<ClientNote> {
    return apiService.post<ClientNote>(API_ENDPOINTS.clientNotes.byClient(clientId), payload);
  },

  update(clientId: string, noteId: string, payload: UpdateClientNotePayload): Promise<ClientNote> {
    return apiService.put<ClientNote>(API_ENDPOINTS.clientNotes.byId(clientId, noteId), payload);
  },
};

export default clientNotesService;
