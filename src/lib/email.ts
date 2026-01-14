/**
 * Email Service Abstraction Layer
 * 
 * Provides a unified interface for email operations that works with:
 * - Azure Functions (production)
 * - Backend Express API
 * 
 * Gmail SMTP Configuration:
 * - Sender: s.susheel9@gmail.com
 * - Display Name: CustomCoachPro
 */

import { api } from "@/lib/api";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface TemplatedEmailOptions {
  to: string;
  templateId: string;
  data: Record<string, unknown>;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult>;
  sendClientInvitation(params: {
    email: string;
    name: string;
    message?: string;
    coachId: string;
    coachName: string;
  }): Promise<EmailResult>;
  sendAdminNotification(params: {
    type: "super_admin_granted" | "super_admin_revoked";
    targetEmail: string;
    targetName: string;
    performedByName: string;
  }): Promise<EmailResult>;
}

/**
 * Azure/Backend API implementation
 * Uses backend Express API which connects to Gmail SMTP
 */
class AzureEmailService implements EmailService {
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const data = await api.post<{ id?: string }>("/api/email/send", options);
      return { success: true, messageId: data?.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      };
    }
  }

  async sendTemplatedEmail(options: TemplatedEmailOptions): Promise<EmailResult> {
    try {
      const data = await api.post<{ id?: string }>("/api/email/send-templated", options);
      return { success: true, messageId: data?.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      };
    }
  }

  async sendClientInvitation(params: {
    email: string;
    name: string;
    message?: string;
    coachId: string;
    coachName: string;
  }): Promise<EmailResult> {
    try {
      const data = await api.post<{ data?: { id?: string } }>("/api/email/client-invitation", params);
      return { success: true, messageId: data?.data?.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      };
    }
  }

  async sendAdminNotification(params: {
    type: "super_admin_granted" | "super_admin_revoked";
    targetEmail: string;
    targetName: string;
    performedByName: string;
  }): Promise<EmailResult> {
    try {
      const data = await api.post<{ id?: string }>("/api/email/admin-notification", params);
      return { success: true, messageId: data?.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      };
    }
  }
}

// Factory function
export function getEmailService(): EmailService {
  return new AzureEmailService();
}

// Export singleton instance
export const emailService = getEmailService();
