/**
 * Database Service Abstraction Layer
 * 
 * All database operations go through the backend API.
 * This file provides a unified interface for components that need direct data access.
 */

import { api } from "@/lib/api";

export interface QueryOptions {
  select?: string;
  filter?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

/**
 * Database service interface - all operations go through API
 */
export interface DatabaseService {
  rawQuery<T>(table: string, options?: QueryOptions): Promise<DatabaseResult<T[]>>;
}

/**
 * API-based database service implementation
 */
class ApiDatabaseService implements DatabaseService {
  async rawQuery<T>(table: string, options: QueryOptions = {}): Promise<DatabaseResult<T[]>> {
    try {
      const params = new URLSearchParams();
      if (options.select) params.append('select', options.select);
      if (options.filter) params.append('filter', JSON.stringify(options.filter));
      if (options.orderBy) params.append('orderBy', JSON.stringify(options.orderBy));
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const endpoint = `/api/admin/data/${table}${queryString ? `?${queryString}` : ''}`;
      
      const data = await api.get<T[]>(endpoint);
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}

// Factory function
export function getDatabaseService(): DatabaseService {
  return new ApiDatabaseService();
}

// Export singleton instance
export const databaseService = getDatabaseService();

/**
 * Database helper - use API for all operations
 */
export const db = {
  query: <T>(table: string, options?: QueryOptions) => databaseService.rawQuery<T>(table, options),
};
