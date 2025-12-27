import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, Exercise } from "@/types";
import apiService from "./api";

export type ExerciseFilters = {
  search?: string;
  muscle?: string;
  tag?: string;
};

export type ExercisePayload = {
  name: string;
  description?: string;
  muscleGroups: string[];
  tags?: string[];
  equipment?: string;
  videoUrl?: string;
};

type ExerciseListResponse = ApiResponse<Exercise[]> & {
  filters?: {
    muscleGroups?: string[];
    tags?: string[];
  };
};

const buildQueryString = (filters?: ExerciseFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.muscle) params.set("muscle", filters.muscle);
  if (filters.tag) params.set("tag", filters.tag);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const exerciseService = {
  async list(filters?: ExerciseFilters): Promise<ExerciseListResponse> {
    const response = await apiService.get<ExerciseListResponse>(
      `${API_ENDPOINTS.exercises.base}${buildQueryString(filters)}`
    );
    return response;
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
