import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely ensures a value is an array - handles Azure SQL returning JSON as strings
 */
export function ensureArray<T>(value: T[] | string | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (value === '' || value === 'null') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If it's comma-separated, split it
      return value.split(',').map(s => s.trim()).filter(s => s) as unknown as T[];
    }
  }
  return [];
}

/**
 * Safely parses a JSON field that may come as a string from Azure SQL
 */
export function parseJsonField<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    if (value === '' || value === 'null') return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return null;
}
