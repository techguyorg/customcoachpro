import { API_ENDPOINTS } from '@/config/api';
import apiService from './api';
import type { Client, ApiResponse, PaginatedResponse } from '@/types';

export interface CreateClientRequest {
  email: string;
  firstName: string;
  lastName: string;
  goals?: string;
  notes?: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string;
}

export const clientService = {
  async getClients(page = 1, pageSize = 10): Promise<PaginatedResponse<Client>> {
    return apiService.get<PaginatedResponse<Client>>(
      `${API_ENDPOINTS.clients.base}?page=${page}&pageSize=${pageSize}`
    );
  },

  async getClientsByCoach(coachId: string): Promise<Client[]> {
    const response = await apiService.get<ApiResponse<Client[]>>(API_ENDPOINTS.clients.byCoach(coachId));
    return response.data;
  },

  async getClient(id: string): Promise<Client> {
    const response = await apiService.get<ApiResponse<Client>>(API_ENDPOINTS.clients.byId(id));
    return response.data;
  },

  async createClient(data: CreateClientRequest): Promise<Client> {
    const response = await apiService.post<ApiResponse<Client>>(API_ENDPOINTS.clients.base, data);
    return response.data;
  },

  async updateClient(data: UpdateClientRequest): Promise<Client> {
    const response = await apiService.put<ApiResponse<Client>>(
      API_ENDPOINTS.clients.byId(data.id),
      data
    );
    return response.data;
  },

  async deleteClient(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.clients.byId(id));
  },
};

export default clientService;
