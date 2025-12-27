import { API_ENDPOINTS } from "@/config/api";
import apiService from "./api";

export type CheckInType = "weight" | "workout" | "diet" | "photos";
export type CheckInStatus = "pending" | "reviewed";

export type CheckInData = {
  weight?: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  completed?: boolean;
  workoutNotes?: string | null;
  complianceRating?: number;
  deviations?: string | null;
  photos?: {
    front?: string | null;
    side?: string | null;
    back?: string | null;
  };
};

export type CheckIn = {
  id: string;
  clientId: string;
  coachId?: string;
  clientName: string;
  clientAvatar?: string | null;
  type: CheckInType;
  status: CheckInStatus;
  submittedAt: string;
  notes?: string | null;
  data: CheckInData;
};

export type CheckInQueryParams = {
  type?: CheckInType;
  status?: CheckInStatus;
  clientId?: string;
  search?: string;
  from?: string;
  to?: string;
  sortBy?: "submittedAt" | "clientName" | "type" | "status";
  sortDirection?: "asc" | "desc";
};

export type CreateCheckInPayload = {
  clientId: string;
  type: CheckInType;
  submittedAt?: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  workoutCompleted?: boolean;
  workoutNotes?: string;
  dietCompliance?: number;
  dietDeviations?: string;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
  notes?: string;
};

export type UpdateCheckInPayload = Partial<CreateCheckInPayload> & {
  status?: CheckInStatus;
};

export type CheckInFilters = {
  status?: CheckInStatus;
  type?: CheckInType;
  coachId?: string;
};

type CheckInApi = {
  id: string;
  clientId: string;
  coachId?: string;
  clientName: string;
  clientAvatar?: string | null;
  type: CheckInType;
  status: CheckInStatus;
  submittedAt: string;
  notes?: string | null;
  data?: {
    weight?: number;
    bodyFat?: number;
    waist?: number;
    chest?: number;
    arms?: number;
    thighs?: number;
    completed?: boolean;
    workoutNotes?: string | null;
    complianceRating?: number;
    deviations?: string | null;
    photos?: {
      front?: string | null;
      side?: string | null;
      back?: string | null;
    };
  };
};

const toDomain = (api: CheckInApi): CheckIn => {
  const photos = api.data?.photos ?? {};

  return {
    id: api.id,
    clientId: api.clientId,
    coachId: api.coachId,
    clientName: api.clientName,
    clientAvatar: api.clientAvatar,
    type: api.type,
    status: api.status,
    submittedAt: api.submittedAt,
    notes: api.notes,
    data: {
      weight: api.data?.weight,
      bodyFat: api.data?.bodyFat,
      waist: api.data?.waist,
      chest: api.data?.chest,
      arms: api.data?.arms,
      thighs: api.data?.thighs,
      completed: api.data?.completed,
      workoutNotes: api.data?.workoutNotes,
      complianceRating: api.data?.complianceRating,
      deviations: api.data?.deviations,
      photos: {
        front: photos.front,
        side: photos.side,
        back: photos.back,
      },
    },
  };
};

const checkInService = {
  buildQueryString(params?: CheckInQueryParams) {
    if (!params) return "";

    const query = new URLSearchParams();

    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.clientId) query.set("clientId", params.clientId);
    if (params.search) query.set("search", params.search);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortDirection) query.set("sortDirection", params.sortDirection);

    const queryString = query.toString();
    return queryString ? `?${queryString}` : "";
  },

  async getCheckIns(params?: CheckInQueryParams): Promise<CheckIn[]> {
    const endpoint = `${API_ENDPOINTS.checkIns.base}${this.buildQueryString(params)}`;
    const response = await apiService.get<CheckInApi[]>(endpoint);
    return response.map(toDomain);
  },

  async getCheckIn(id: string): Promise<CheckIn> {
    const response = await apiService.get<CheckInApi>(API_ENDPOINTS.checkIns.byId(id));
    return toDomain(response);
  },

  async createCheckIn(payload: CreateCheckInPayload): Promise<CheckIn> {
    const response = await apiService.post<CheckInApi>(API_ENDPOINTS.checkIns.base, payload);
    return toDomain(response);
  },

  async updateCheckIn(id: string, payload: UpdateCheckInPayload): Promise<CheckIn> {
    const response = await apiService.put<CheckInApi>(API_ENDPOINTS.checkIns.byId(id), payload);
    return toDomain(response);
  },

  async deleteCheckIn(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.checkIns.byId(id));
  },

  async markReviewed(id: string): Promise<CheckIn> {
    const response = await apiService.put<CheckInApi>(API_ENDPOINTS.checkIns.review(id));
    return toDomain(response);
  },

  async markReviewedBulk(ids: string[]): Promise<CheckIn[]> {
    const endpoint = `${API_ENDPOINTS.checkIns.base}/bulk/review`;
    const response = await apiService.put<CheckInApi[]>(endpoint, { ids });
    return response.map(toDomain);
  },

  async requestUpdate(ids: string[], message?: string): Promise<void> {
    const endpoint = `${API_ENDPOINTS.checkIns.base}/actions/request-update`;
    await apiService.post(endpoint, { ids, message });
  },
};

export default checkInService;
