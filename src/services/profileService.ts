// src/services/profileService.ts

import { API_ENDPOINTS } from "@/config/api";
import apiService from "@/services/api";

export type MyProfile = {
  id: string;
  email: string;
  role: "coach" | "client" | "admin";
  profile: {
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;

    // client basics
    startDate?: string | null;
    heightCm?: number | null;
    currentWeight?: number | null;
    targetWeight?: number | null;
  };
};

export type UpdateMyProfileRequest = {
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;

  startDate?: string | null;
  heightCm?: number | null;
  currentWeight?: number | null;
  targetWeight?: number | null;
};

export const profileService = {
  async getMe(): Promise<MyProfile> {
    return apiService.get<MyProfile>(API_ENDPOINTS.profile.me);
  },

  async updateMe(payload: UpdateMyProfileRequest): Promise<MyProfile> {
    return apiService.put<MyProfile>(API_ENDPOINTS.profile.me, payload);
  },
};

export default profileService;
