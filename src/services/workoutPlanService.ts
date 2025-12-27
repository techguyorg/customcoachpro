import { API_ENDPOINTS } from "@/config/api";
import type { ApiResponse, ClientWorkoutPlan, WorkoutPlan } from "@/types";
import apiService from "./api";

export type WorkoutExerciseInput = {
  exerciseId?: string;
  exerciseName?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  notes?: string;
  order: number;
};

export type WorkoutDayInput = {
  name: string;
  dayNumber: number;
  exercises: WorkoutExerciseInput[];
};

export type WorkoutPlanPayload = {
  name: string;
  description?: string;
  durationWeeks: number;
  days: WorkoutDayInput[];
};

export type UpdateWorkoutPlanPayload = Partial<Omit<WorkoutPlanPayload, "days">> & {
  days?: WorkoutDayInput[];
};

export type AssignWorkoutPlanPayload = {
  clientId: string;
  workoutPlanId: string;
  startDate: string;
};

const workoutPlanService = {
  async list(): Promise<WorkoutPlan[]> {
    const response = await apiService.get<ApiResponse<WorkoutPlan[]>>(API_ENDPOINTS.workoutPlans.base);
    return response.data;
  },

  async get(id: string): Promise<WorkoutPlan> {
    const response = await apiService.get<ApiResponse<WorkoutPlan>>(API_ENDPOINTS.workoutPlans.byId(id));
    return response.data;
  },

  async listForClient(clientId: string): Promise<ClientWorkoutPlan[]> {
    const response = await apiService.get<ApiResponse<ClientWorkoutPlan[]>>(
      API_ENDPOINTS.workoutPlans.clientPlans(clientId)
    );
    return response.data;
  },

  async create(payload: WorkoutPlanPayload): Promise<WorkoutPlan> {
    const response = await apiService.post<ApiResponse<WorkoutPlan>>(API_ENDPOINTS.workoutPlans.base, payload);
    return response.data;
  },

  async update(id: string, payload: UpdateWorkoutPlanPayload): Promise<WorkoutPlan> {
    const response = await apiService.put<ApiResponse<WorkoutPlan>>(API_ENDPOINTS.workoutPlans.byId(id), payload);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.workoutPlans.byId(id));
  },

  async assign(payload: AssignWorkoutPlanPayload): Promise<ClientWorkoutPlan> {
    const response = await apiService.post<ApiResponse<ClientWorkoutPlan>>(API_ENDPOINTS.workoutPlans.assign, payload);
    return response.data;
  },

  async duplicate(id: string): Promise<WorkoutPlan> {
    const response = await apiService.post<ApiResponse<WorkoutPlan>>(API_ENDPOINTS.workoutPlans.duplicate(id));
    return response.data;
  },
};

export default workoutPlanService;
