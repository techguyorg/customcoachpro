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
  async getCheckIns(): Promise<CheckIn[]> {
    const response = await apiService.get<CheckInApi[]>(API_ENDPOINTS.checkIns.base);
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
};

export default checkInService;
