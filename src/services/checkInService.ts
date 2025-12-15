import { API_ENDPOINTS } from '@/config/api';
import apiService from './api';
import type { 
  WeightCheckIn, 
  ProgressPhoto, 
  WorkoutCheckIn, 
  DietCheckIn,
  ApiResponse 
} from '@/types';

export interface CreateWeightCheckInRequest {
  clientId: string;
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
}

export interface CreateDietCheckInRequest {
  clientId: string;
  dietPlanId: string;
  date: string;
  complianceRating: number;
  deviations?: string;
  notes?: string;
}

export interface CreateWorkoutCheckInRequest {
  clientId: string;
  workoutPlanId: string;
  date: string;
  completed: boolean;
  notes?: string;
}

export const checkInService = {
  // Weight Check-ins
  async getWeightCheckIns(clientId: string): Promise<WeightCheckIn[]> {
    const response = await apiService.get<ApiResponse<WeightCheckIn[]>>(
      API_ENDPOINTS.checkIns.weight.byClient(clientId)
    );
    return response.data;
  },

  async createWeightCheckIn(data: CreateWeightCheckInRequest): Promise<WeightCheckIn> {
    const response = await apiService.post<ApiResponse<WeightCheckIn>>(
      API_ENDPOINTS.checkIns.weight.base,
      data
    );
    return response.data;
  },

  async deleteWeightCheckIn(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.checkIns.weight.byId(id));
  },

  // Progress Photos
  async getProgressPhotos(clientId: string): Promise<ProgressPhoto[]> {
    const response = await apiService.get<ApiResponse<ProgressPhoto[]>>(
      API_ENDPOINTS.checkIns.photos.byClient(clientId)
    );
    return response.data;
  },

  async uploadProgressPhoto(
    clientId: string,
    date: string,
    photoType: 'front' | 'side' | 'back',
    file: File
  ): Promise<ProgressPhoto> {
    const formData = new FormData();
    formData.append('clientId', clientId);
    formData.append('date', date);
    formData.append('photoType', photoType);
    formData.append('file', file);

    const response = await apiService.uploadFile(
      API_ENDPOINTS.checkIns.photos.base,
      file,
      'file'
    );
    return response as ProgressPhoto;
  },

  // Workout Check-ins
  async getWorkoutCheckIns(clientId: string): Promise<WorkoutCheckIn[]> {
    const response = await apiService.get<ApiResponse<WorkoutCheckIn[]>>(
      API_ENDPOINTS.checkIns.workout.byClient(clientId)
    );
    return response.data;
  },

  async createWorkoutCheckIn(data: CreateWorkoutCheckInRequest): Promise<WorkoutCheckIn> {
    const response = await apiService.post<ApiResponse<WorkoutCheckIn>>(
      API_ENDPOINTS.checkIns.workout.base,
      data
    );
    return response.data;
  },

  // Diet Check-ins
  async getDietCheckIns(clientId: string): Promise<DietCheckIn[]> {
    const response = await apiService.get<ApiResponse<DietCheckIn[]>>(
      API_ENDPOINTS.checkIns.diet.byClient(clientId)
    );
    return response.data;
  },

  async createDietCheckIn(data: CreateDietCheckInRequest): Promise<DietCheckIn> {
    const response = await apiService.post<ApiResponse<DietCheckIn>>(
      API_ENDPOINTS.checkIns.diet.base,
      data
    );
    return response.data;
  },
};

export default checkInService;
