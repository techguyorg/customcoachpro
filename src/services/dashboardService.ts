import apiService from "@/services/api";

export type CoachDashboardStats = {
  totalClients: number;
  activeClients: number;
  pendingCheckIns: number;
  workoutPlansCreated: number;
  dietPlansCreated: number;
};

export type ClientDashboardStats = {
  currentWeight: number;
  weightChange: number;
  workoutsCompleted: number;
  dietComplianceAverage: number;
  daysOnPlan: number;
};

const dashboardService = {
  async getCoachStats(): Promise<CoachDashboardStats> {
    return apiService.get<CoachDashboardStats>("/dashboard/coach");
  },

  async getClientStats(): Promise<ClientDashboardStats> {
    return apiService.get<ClientDashboardStats>("/dashboard/client");
  },
};

export default dashboardService;
