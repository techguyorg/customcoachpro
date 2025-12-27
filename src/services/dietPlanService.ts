import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, ClientDietPlan, DietPlan } from "@/types";
import apiService from "./api";

export type DietMealInput = {
  mealId: string;
  mealTime: string;
  order: number;
};

export type DietDayInput = {
  dayNumber: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: DietMealInput[];
};

export type DietPlanPayload = {
  name: string;
  description?: string;
  days: DietDayInput[];
};

export type UpdateDietPlanPayload = Partial<Omit<DietPlanPayload, "days">> & {
  days?: DietDayInput[];
};

export type AssignDietPlanPayload = {
  clientId: string;
  dietPlanId: string;
  startDate: string;
};

export type DietPlanTemplate = {
  id?: string;
  name: string;
  description: string;
  payload: DietPlanPayload;
  source?: "system" | "coach";
  coachId?: string;
};

const dietPlanService = {
  async list(): Promise<DietPlan[]> {
    const response = await apiService.get<ApiResponse<DietPlan[]>>(API_ENDPOINTS.dietPlans.base);
    return response.data;
  },

  async templates(): Promise<DietPlanTemplate[]> {
    const response = await apiService.get<ApiResponse<DietPlanTemplate[]>>(API_ENDPOINTS.dietPlans.templates);
    return response.data;
  },

  async get(id: string): Promise<DietPlan> {
    const response = await apiService.get<ApiResponse<DietPlan>>(API_ENDPOINTS.dietPlans.byId(id));
    return response.data;
  },

  async create(payload: DietPlanPayload): Promise<DietPlan> {
    const response = await apiService.post<ApiResponse<DietPlan>>(API_ENDPOINTS.dietPlans.base, payload);
    return response.data;
  },

  async update(id: string, payload: UpdateDietPlanPayload): Promise<DietPlan> {
    const response = await apiService.put<ApiResponse<DietPlan>>(API_ENDPOINTS.dietPlans.byId(id), payload);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.dietPlans.byId(id));
  },

  async listForClient(clientId: string): Promise<ClientDietPlan[]> {
    const response = await apiService.get<ApiResponse<ClientDietPlan[]>>(API_ENDPOINTS.dietPlans.clientPlans(clientId));
    return response.data;
  },

  async assign(payload: AssignDietPlanPayload): Promise<ClientDietPlan> {
    const response = await apiService.post<ApiResponse<ClientDietPlan>>(API_ENDPOINTS.dietPlans.assign, payload);
    return response.data;
  },
};

export default dietPlanService;
