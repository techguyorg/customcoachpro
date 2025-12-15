import { API_ENDPOINTS } from '@/config/api';
import apiService from './api';
import type { 
  Exercise, 
  WorkoutPlan, 
  ClientWorkoutPlan,
  ApiResponse 
} from '@/types';

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  muscleGroup: string;
  equipmentRequired?: string;
  videoUrl?: string;
}

export interface CreateWorkoutPlanRequest {
  name: string;
  description?: string;
  durationWeeks: number;
  days: {
    name: string;
    dayNumber: number;
    exercises: {
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds: number;
      tempo?: string;
      notes?: string;
      order: number;
    }[];
  }[];
}

export interface AssignWorkoutPlanRequest {
  clientId: string;
  workoutPlanId: string;
  startDate: string;
}

export const workoutService = {
  // Exercises
  async getExercises(): Promise<Exercise[]> {
    const response = await apiService.get<ApiResponse<Exercise[]>>(API_ENDPOINTS.exercises.base);
    return response.data;
  },

  async getExercise(id: string): Promise<Exercise> {
    const response = await apiService.get<ApiResponse<Exercise>>(API_ENDPOINTS.exercises.byId(id));
    return response.data;
  },

  async createExercise(data: CreateExerciseRequest): Promise<Exercise> {
    const response = await apiService.post<ApiResponse<Exercise>>(
      API_ENDPOINTS.exercises.base,
      data
    );
    return response.data;
  },

  async updateExercise(id: string, data: Partial<CreateExerciseRequest>): Promise<Exercise> {
    const response = await apiService.put<ApiResponse<Exercise>>(
      API_ENDPOINTS.exercises.byId(id),
      data
    );
    return response.data;
  },

  async deleteExercise(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.exercises.byId(id));
  },

  // Workout Plans
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    const response = await apiService.get<ApiResponse<WorkoutPlan[]>>(
      API_ENDPOINTS.workoutPlans.base
    );
    return response.data;
  },

  async getWorkoutPlan(id: string): Promise<WorkoutPlan> {
    const response = await apiService.get<ApiResponse<WorkoutPlan>>(
      API_ENDPOINTS.workoutPlans.byId(id)
    );
    return response.data;
  },

  async createWorkoutPlan(data: CreateWorkoutPlanRequest): Promise<WorkoutPlan> {
    const response = await apiService.post<ApiResponse<WorkoutPlan>>(
      API_ENDPOINTS.workoutPlans.base,
      data
    );
    return response.data;
  },

  async updateWorkoutPlan(id: string, data: Partial<CreateWorkoutPlanRequest>): Promise<WorkoutPlan> {
    const response = await apiService.put<ApiResponse<WorkoutPlan>>(
      API_ENDPOINTS.workoutPlans.byId(id),
      data
    );
    return response.data;
  },

  async deleteWorkoutPlan(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.workoutPlans.byId(id));
  },

  // Client Workout Plans
  async getClientWorkoutPlans(clientId: string): Promise<ClientWorkoutPlan[]> {
    const response = await apiService.get<ApiResponse<ClientWorkoutPlan[]>>(
      API_ENDPOINTS.workoutPlans.clientPlans(clientId)
    );
    return response.data;
  },

  async assignWorkoutPlan(data: AssignWorkoutPlanRequest): Promise<ClientWorkoutPlan> {
    const response = await apiService.post<ApiResponse<ClientWorkoutPlan>>(
      API_ENDPOINTS.workoutPlans.assign,
      data
    );
    return response.data;
  },
};

export default workoutService;
