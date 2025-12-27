import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, Exercise, PaginatedResponse } from "@/types";
import apiService from "./api";

export type ExerciseFilters = {
  search?: string;
  muscle?: string;
  tag?: string;
  equipment?: string;
  page?: number;
  pageSize?: number;
};

export type ExercisePayload = {
  name: string;
  description?: string;
  muscleGroups: string[];
  tags?: string[];
  equipment?: string;
  videoUrl?: string;
};

export type ExerciseListResult = {
  items: Exercise[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: {
    muscleGroups: string[];
    tags: string[];
    equipment: string[];
  };
};

type ExerciseListResponse = ApiResponse<PaginatedResponse<Exercise> & {
  filters?: {
    muscleGroups?: string[];
    tags?: string[];
    equipment?: string[];
  };
}> &
  PaginatedResponse<Exercise> & {
    filters?: {
      muscleGroups?: string[];
      tags?: string[];
      equipment?: string[];
    };
  } &
  ApiResponse<Exercise[]>;

const buildQueryString = (filters?: ExerciseFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.muscle) params.set("muscle", filters.muscle);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.equipment) params.set("equipment", filters.equipment);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const normalizeFilters = (response: ExerciseListResponse) => {
  const filterSource =
    (response as { filters?: ExerciseListResult["filters"] }).filters ||
    (response.data as { filters?: ExerciseListResult["filters"] })?.filters ||
    {};

  return {
    muscleGroups: filterSource.muscleGroups ?? [],
    tags: filterSource.tags ?? [],
    equipment: (filterSource as { equipment?: string[] }).equipment ?? [],
  };
};

const exerciseService = {
  async list(filters?: ExerciseFilters): Promise<ExerciseListResult> {
    const response = await apiService.get<ExerciseListResponse>(
      `${API_ENDPOINTS.exercises.base}${buildQueryString(filters)}`
    );

    const payload = (response as unknown as { data?: unknown }).data ?? response;
    const paginated = payload as PaginatedResponse<Exercise>;
    const list = Array.isArray((paginated as PaginatedResponse<Exercise>).data)
      ? paginated.data
      : (payload as Exercise[]);

    const total = paginated.total ?? list.length;
    const page = paginated.page ?? filters?.page ?? 1;
    const pageSize = paginated.pageSize ?? filters?.pageSize ?? list.length || 10;
    const totalPages = paginated.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

    return {
      items: list,
      total,
      page,
      pageSize,
      totalPages,
      filters: normalizeFilters(response),
    };
  },

  async get(id: string): Promise<Exercise> {
    const response = await apiService.get<ApiResponse<Exercise>>(API_ENDPOINTS.exercises.byId(id));
    return response.data;
  },

  async create(payload: ExercisePayload): Promise<Exercise> {
    const response = await apiService.post<ApiResponse<Exercise>>(API_ENDPOINTS.exercises.base, payload);
    return response.data;
  },

  async update(id: string, payload: Partial<ExercisePayload>): Promise<Exercise> {
    const response = await apiService.put<ApiResponse<Exercise>>(API_ENDPOINTS.exercises.byId(id), payload);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.exercises.byId(id));
  },
};

export default exerciseService;
