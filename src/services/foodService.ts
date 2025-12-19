import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, Food } from "@/types";
import apiService from "./api";

export type FoodPayload = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
};

const foodService = {
  async list(): Promise<Food[]> {
    const response = await apiService.get<ApiResponse<Food[]>>(API_ENDPOINTS.foods.base);
    return response.data;
  },

  async get(id: string): Promise<Food> {
    const response = await apiService.get<ApiResponse<Food>>(API_ENDPOINTS.foods.byId(id));
    return response.data;
  },

  async create(payload: FoodPayload): Promise<Food> {
    const response = await apiService.post<ApiResponse<Food>>(API_ENDPOINTS.foods.base, payload);
    return response.data;
  },

  async update(id: string, payload: Partial<FoodPayload>): Promise<Food> {
    const response = await apiService.put<ApiResponse<Food>>(API_ENDPOINTS.foods.byId(id), payload);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.foods.byId(id));
  },
};

export default foodService;
