import apiService from "@/services/api";

export type CoachDashboardStats = {
  totalClients: number;
  activeClients: number;
  pendingCheckIns: number;
  workoutPlansCreated: number;
  dietPlansCreated: number;
  attentionItems: AttentionItem[];
  upcomingRenewals: UpcomingRenewal[];
  complianceTrend: ComplianceTrend;
};

export type ClientDashboardStats = {
  currentWeight: number;
  weightChange: number;
  workoutsCompleted: number;
  dietComplianceAverage: number;
  daysOnPlan: number;
};

export type AttentionItem = {
  clientId: string;
  clientName: string;
  type: string;
  summary: string;
  submittedAt?: string;
};

export type UpcomingRenewal = {
  clientId: string;
  clientName: string;
  planId: string;
  planName: string;
  planType: "workout" | "diet";
  renewalDate: string;
  daysRemaining?: number;
  summary?: string;
};

export type ComplianceTrend = {
  average: number;
  change: number;
  sampleSize: number;
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
