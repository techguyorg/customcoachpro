import apiService from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";

export type AnalyticsFilters = {
  startDate?: string;
  endDate?: string;
  clientIds?: string[];
};

export type EngagementPoint = {
  date: string;
  total: number;
  weight: number;
  workout: number;
  diet: number;
  photos: number;
};

export type CompliancePoint = {
  date: string;
  average: number;
};

export type WeightChangeSlice = {
  clientId: string;
  clientName: string;
  startWeight: number;
  endWeight: number;
  change: number;
};

export type WorkoutAdherencePoint = {
  date: string;
  completionRate: number;
  completed: number;
  total: number;
};

export type PlanSummary = {
  active: number;
  completed: number;
  total: number;
};

export type AnalyticsResponse = {
  startDate: string;
  endDate: string;
  clientIds: string[];
  engagement: {
    totalCheckIns: number;
    activeClients: number;
    trend: EngagementPoint[];
  };
  compliance: {
    averageCompliance: number;
    trend: CompliancePoint[];
  };
  weightChange: {
    distribution: WeightChangeSlice[];
  };
  workoutAdherence: {
    completionRate: number;
    completedWorkouts: number;
    totalWorkoutCheckIns: number;
    trend: WorkoutAdherencePoint[];
  };
  planOutcomes: {
    workoutPlans: PlanSummary;
    dietPlans: PlanSummary;
  };
};

const analyticsService = {
  async getAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.clientIds?.length) params.set("clientIds", filters.clientIds.join(","));

    const query = params.toString();
    const endpoint = query ? `${API_ENDPOINTS.analytics.base}?${query}` : API_ENDPOINTS.analytics.base;

    return apiService.get<AnalyticsResponse>(endpoint);
  },
};

export default analyticsService;
