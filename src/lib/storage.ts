/**
 * Storage Service Abstraction Layer
 * 
 * All file storage operations go through the backend API,
 * which handles Azure Blob Storage.
 */

import { api } from "@/lib/api";

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface StorageService {
  uploadFile(bucket: string, path: string, file: File): Promise<UploadResult>;
  uploadBase64(bucket: string, path: string, base64Data: string, contentType: string): Promise<UploadResult>;
  getPublicUrl(bucket: string, path: string): string;
  getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string | null>;
  deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }>;
  listFiles(bucket: string, path?: string): Promise<{ data: string[]; error?: string }>;
}

/**
 * Azure Blob Storage implementation via API
 */
class AzureStorageService implements StorageService {
  async uploadFile(bucket: string, path: string, file: File): Promise<UploadResult> {
    try {
      const data = await api.upload<{ path: string; url: string }>(`/api/storage/upload`, file, `${bucket}/${path}`);
      return { success: true, path: data.path, url: data.url };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async uploadBase64(
    bucket: string,
    path: string,
    base64Data: string,
    contentType: string
  ): Promise<UploadResult> {
    try {
      const data = await api.post<{ path: string; url: string }>('/api/storage/upload-base64', {
        bucket,
        path,
        base64Data,
        contentType,
      });
      return { success: true, path: data.path, url: data.url };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    // Azure blob storage URL format
    const baseUrl = import.meta.env.VITE_AZURE_STORAGE_URL || '';
    return `${baseUrl}/${bucket}/${path}`;
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    try {
      const data = await api.post<{ signedUrl: string }>('/api/storage/signed-url', {
        bucket,
        path,
        expiresIn,
      });
      return data.signedUrl;
    } catch (err) {
      console.error("Error creating signed URL:", err);
      return null;
    }
  }

  async deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.delete(`/api/storage/files?bucket=${bucket}&path=${encodeURIComponent(path)}`);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async listFiles(bucket: string, path = ""): Promise<{ data: string[]; error?: string }> {
    try {
      const data = await api.get<{ files: string[] }>(`/api/storage/list?bucket=${bucket}&path=${encodeURIComponent(path)}`);
      return { data: data.files };
    } catch (err) {
      return {
        data: [],
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}

// Factory function
export function getStorageService(): StorageService {
  return new AzureStorageService();
}

// Export singleton instance
export const storageService = getStorageService();

/**
 * Convenience function for uploading files
 * Used by profile pages for avatar uploads
 */
export async function uploadFile(
  file: File,
  bucket: string,
  userId: string
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  return storageService.uploadFile(bucket, fileName, file);
}
