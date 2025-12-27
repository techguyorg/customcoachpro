import type { NotificationItem } from "@/types";
import apiService from "./api";
import { API_ENDPOINTS } from "@/config/api";

export interface MarkAllReadResponse {
  updated: number;
}

const notificationService = {
  getNotifications: () => apiService.get<NotificationItem[]>(API_ENDPOINTS.notifications.base),
  markRead: (id: string) => apiService.post<{ ok: boolean }>(API_ENDPOINTS.notifications.markRead(id)),
  markAllRead: () => apiService.post<MarkAllReadResponse>(API_ENDPOINTS.notifications.markAllRead),
};

export default notificationService;
