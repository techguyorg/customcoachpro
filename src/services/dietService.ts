import { API_ENDPOINTS } from '@/config/api';
import apiService from './api';
import type { 
  Food, 
  Meal, 
  DietPlan, 
  ClientDietPlan,
  ApiResponse 
} from '@/types';

export interface CreateFoodRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export interface CreateMealRequest {
  name: string;
  description?: string;
  foods: {
    foodId: string;
    quantity: number;
  }[];
}

export interface CreateDietPlanRequest {
  name: string;
  description?: string;
  days: {
    dayNumber: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    meals: {
      mealId: string;
      mealTime: string;
      order: number;
    }[];
  }[];
}

export interface AssignDietPlanRequest {
  clientId: string;
  dietPlanId: string;
  startDate: string;
}

export const dietService = {
  // Foods
  async getFoods(): Promise<Food[]> {
    const response = await apiService.get<ApiResponse<Food[]>>(API_ENDPOINTS.foods.base);
    return response.data;
  },

  async getFood(id: string): Promise<Food> {
    const response = await apiService.get<ApiResponse<Food>>(API_ENDPOINTS.foods.byId(id));
    return response.data;
  },

  async createFood(data: CreateFoodRequest): Promise<Food> {
    const response = await apiService.post<ApiResponse<Food>>(API_ENDPOINTS.foods.base, data);
    return response.data;
  },

  async updateFood(id: string, data: Partial<CreateFoodRequest>): Promise<Food> {
    const response = await apiService.put<ApiResponse<Food>>(API_ENDPOINTS.foods.byId(id), data);
    return response.data;
  },

  async deleteFood(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.foods.byId(id));
  },

  // Meals
  async getMeals(): Promise<Meal[]> {
    const response = await apiService.get<ApiResponse<Meal[]>>(API_ENDPOINTS.meals.base);
    return response.data;
  },

  async getMeal(id: string): Promise<Meal> {
    const response = await apiService.get<ApiResponse<Meal>>(API_ENDPOINTS.meals.byId(id));
    return response.data;
  },

  async createMeal(data: CreateMealRequest): Promise<Meal> {
    const response = await apiService.post<ApiResponse<Meal>>(API_ENDPOINTS.meals.base, data);
    return response.data;
  },

  async updateMeal(id: string, data: Partial<CreateMealRequest>): Promise<Meal> {
    const response = await apiService.put<ApiResponse<Meal>>(API_ENDPOINTS.meals.byId(id), data);
    return response.data;
  },

  async deleteMeal(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.meals.byId(id));
  },

  // Diet Plans
  async getDietPlans(): Promise<DietPlan[]> {
    const response = await apiService.get<ApiResponse<DietPlan[]>>(API_ENDPOINTS.dietPlans.base);
    return response.data;
  },

  async getDietPlan(id: string): Promise<DietPlan> {
    const response = await apiService.get<ApiResponse<DietPlan>>(API_ENDPOINTS.dietPlans.byId(id));
    return response.data;
  },

  async createDietPlan(data: CreateDietPlanRequest): Promise<DietPlan> {
    const response = await apiService.post<ApiResponse<DietPlan>>(
      API_ENDPOINTS.dietPlans.base,
      data
    );
    return response.data;
  },

  async updateDietPlan(id: string, data: Partial<CreateDietPlanRequest>): Promise<DietPlan> {
    const response = await apiService.put<ApiResponse<DietPlan>>(
      API_ENDPOINTS.dietPlans.byId(id),
      data
    );
    return response.data;
  },

  async deleteDietPlan(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.dietPlans.byId(id));
  },

  // Client Diet Plans
  async getClientDietPlans(clientId: string): Promise<ClientDietPlan[]> {
    const response = await apiService.get<ApiResponse<ClientDietPlan[]>>(
      API_ENDPOINTS.dietPlans.clientPlans(clientId)
    );
    return response.data;
  },

  async assignDietPlan(data: AssignDietPlanRequest): Promise<ClientDietPlan> {
    const response = await apiService.post<ApiResponse<ClientDietPlan>>(
      API_ENDPOINTS.dietPlans.assign,
      data
    );
    return response.data;
  },
};

export default dietService;
