import apiService from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";

export type CoachClientListItem = {
  id: string;
  email: string;
  displayName: string;
  startDate?: string;
  currentWeight?: number;
  targetWeight?: number;
};

export type CoachClientDetail = {
  id: string;
  email: string;
  role: string;
  profile: {
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
    startDate?: string | null;
    heightCm?: number | null;
    startWeight?: number | null;
    currentWeight?: number | null;
    targetWeight?: number | null;
  };
};

export type CreateClientRequest = {
  firstName: string;
  lastName: string;
  email: string;
  goals?: string;
  notes?: string;
  startDate?: string;
  heightCm?: number;
  startWeight?: number;
  currentWeight?: number;
  targetWeight?: number;
};

export type CreateClientResponse = {
  id: string;
  email: string;
  tempPassword: string;
  profile: {
    displayName: string;
    startDate?: string;
    heightCm?: number;
    currentWeight?: number;
    targetWeight?: number;
  };
};

export type UpdateClientRequest = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  startDate?: string;
  heightCm?: number;
  startWeight?: number;
  currentWeight?: number;
  targetWeight?: number;
};

const coachService = {
  async getClients(): Promise<CoachClientListItem[]> {
    return apiService.get<CoachClientListItem[]>("/coach/clients");
  },

  async getClient(id: string): Promise<CoachClientDetail> {
    return apiService.get<CoachClientDetail>(`/coach/clients/${id}`);
  },

  async createClient(req: CreateClientRequest): Promise<CreateClientResponse> {
    return apiService.post<CreateClientResponse>("/coach/clients", req);
  },

  async updateClient(id: string, req: UpdateClientRequest): Promise<CoachClientDetail> {
    return apiService.put<CoachClientDetail>(`/coach/clients/${id}`, req);
  },
};

export default coachService;
