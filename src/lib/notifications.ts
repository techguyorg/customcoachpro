/**
 * Notification Service Abstraction Layer
 * 
 * All notification operations go through the backend API.
 */

import { api } from "@/lib/api";
import { emailService } from "./email";

export interface Notification {
  id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  createdAt?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export interface NotificationService {
  sendNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<NotificationResult>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<NotificationResult>;
  markAllAsRead(userId: string): Promise<NotificationResult>;
  getUnreadCount(userId: string): Promise<number>;
  notifyUser(params: {
    userId: string;
    email: string;
    type: string;
    title: string;
    message: string;
    emailSubject?: string;
    emailHtml?: string;
    sendEmail?: boolean;
  }): Promise<NotificationResult>;
}

/**
 * API-based notification service
 */
class ApiNotificationService implements NotificationService {
  async sendNotification(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<NotificationResult> {
    try {
      const data = await api.post<{ id: string }>('/api/notifications', {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        referenceType: notification.referenceType,
        referenceId: notification.referenceId,
        data: notification.data,
      });

      return { success: true, notificationId: data.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const data = await api.get<Array<{
        id: string;
        user_id: string;
        type: string;
        title: string;
        message: string;
        reference_type?: string;
        reference_id?: string;
        data?: Record<string, unknown>;
        is_read: boolean;
        created_at: string;
      }>>(`/api/notifications?limit=${limit}`);

      return data.map((n) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        referenceType: n.reference_type,
        referenceId: n.reference_id,
        data: n.data,
        isRead: n.is_read,
        createdAt: n.created_at,
      }));
    } catch (err) {
      console.error("Error fetching notifications:", err);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<NotificationResult> {
    try {
      await api.put(`/api/notifications/${notificationId}/read`, {});
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async markAllAsRead(userId: string): Promise<NotificationResult> {
    try {
      await api.put('/api/notifications/mark-all-read', {});
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const data = await api.get<{ count: number }>('/api/notifications/unread-count');
      return data.count;
    } catch (err) {
      console.error("Error getting unread count:", err);
      return 0;
    }
  }

  async notifyUser(params: {
    userId: string;
    email: string;
    type: string;
    title: string;
    message: string;
    emailSubject?: string;
    emailHtml?: string;
    sendEmail?: boolean;
  }): Promise<NotificationResult> {
    // Send in-app notification
    const inAppResult = await this.sendNotification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
    });

    // Optionally send email
    if (params.sendEmail && params.emailHtml) {
      try {
        await emailService.sendEmail({
          to: params.email,
          subject: params.emailSubject || params.title,
          html: params.emailHtml,
        });
      } catch (err) {
        console.error("Failed to send email notification:", err);
      }
    }

    return inAppResult;
  }
}

// Factory function
export function getNotificationService(): NotificationService {
  return new ApiNotificationService();
}

// Export singleton instance
export const notificationService = getNotificationService();
