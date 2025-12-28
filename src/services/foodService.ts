import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, Food, PaginatedResponse } from "@/types";
import apiService from "./api";

export type FoodPayload = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
};

export type FoodFilters = {
  search?: string;
  caloriesMin?: number;
  caloriesMax?: number;
  proteinMin?: number;
  proteinMax?: number;
  carbsMin?: number;
  carbsMax?: number;
  fatMin?: number;
  fatMax?: number;
  page?: number;
  pageSize?: number;
};

export type FoodListResult = {
  items: Food[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type FoodListResponse = ApiResponse<PaginatedResponse<Food>> & PaginatedResponse<Food> & ApiResponse<Food[]>;

const buildQueryString = (filters?: FoodFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.caloriesMin !== undefined) params.set("caloriesMin", String(filters.caloriesMin));
  if (filters.caloriesMax !== undefined) params.set("caloriesMax", String(filters.caloriesMax));
  if (filters.proteinMin !== undefined) params.set("proteinMin", String(filters.proteinMin));
  if (filters.proteinMax !== undefined) params.set("proteinMax", String(filters.proteinMax));
  if (filters.carbsMin !== undefined) params.set("carbsMin", String(filters.carbsMin));
  if (filters.carbsMax !== undefined) params.set("carbsMax", String(filters.carbsMax));
  if (filters.fatMin !== undefined) params.set("fatMin", String(filters.fatMin));
  if (filters.fatMax !== undefined) params.set("fatMax", String(filters.fatMax));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const foodService = {
  async list(filters?: FoodFilters): Promise<FoodListResult> {
    const response = await apiService.get<FoodListResponse>(`${API_ENDPOINTS.foods.base}${buildQueryString(filters)}`);
    const payload = (response as unknown as { data?: unknown }).data ?? response;
    const paginated = payload as PaginatedResponse<Food>;
    const list = Array.isArray((paginated as PaginatedResponse<Food>).data)
      ? paginated.data
      : (payload as Food[]);

    const total = paginated.total ?? list.length;
    const page = paginated.page ?? filters?.page ?? 1;
    const pageSize = paginated.pageSize ?? filters?.pageSize ?? (list.length || 10);
    const totalPages = paginated.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

    return {
      items: list,
      total,
      page,
      pageSize,
      totalPages,
    };
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
