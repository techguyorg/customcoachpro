import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, Meal } from "@/types";
import apiService from "./api";

export type MealFoodInput = {
  foodId: string;
  quantity: number;
};

export type MealPayload = {
  name: string;
  description?: string;
  foods: MealFoodInput[];
};

export type UpdateMealPayload = Partial<Omit<MealPayload, "foods">> & { foods?: MealFoodInput[] };

const mealService = {
  async list(): Promise<Meal[]> {
    const response = await apiService.get<ApiResponse<Meal[]>>(API_ENDPOINTS.meals.base);
    return response.data;
  },

  async get(id: string): Promise<Meal> {
    const response = await apiService.get<ApiResponse<Meal>>(API_ENDPOINTS.meals.byId(id));
    return response.data;
  },

  async create(payload: MealPayload): Promise<Meal> {
    const response = await apiService.post<ApiResponse<Meal>>(API_ENDPOINTS.meals.base, payload);
    return response.data;
  },

  async update(id: string, payload: UpdateMealPayload): Promise<Meal> {
    const response = await apiService.put<ApiResponse<Meal>>(API_ENDPOINTS.meals.byId(id), payload);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.meals.byId(id));
  },
};

export default mealService;
