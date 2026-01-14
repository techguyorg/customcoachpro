import { v4 as uuidv4 } from 'uuid';
import { execute } from '../db';

export interface AuditLogEntry {
  adminUserId: string;
  actionType: string;
  targetUserId?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Log an administrative action for audit purposes
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await execute(
      `INSERT INTO admin_audit_logs 
       (id, admin_user_id, action_type, target_user_id, target_resource_type, target_resource_id, details, ip_address)
       VALUES (@id, @adminUserId, @actionType, @targetUserId, @targetResourceType, @targetResourceId, @details, @ipAddress)`,
      {
        id: uuidv4(),
        adminUserId: entry.adminUserId,
        actionType: entry.actionType,
        targetUserId: entry.targetUserId || null,
        targetResourceType: entry.targetResourceType || null,
        targetResourceId: entry.targetResourceId || null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress || null
      }
    );
    console.log(`Audit log: ${entry.actionType} by ${entry.adminUserId}`);
  } catch (error) {
    // Log but don't throw - audit failure shouldn't break main flow
    console.error('Failed to log audit event:', error);
  }
}

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
  // User management
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  
  // Role management
  ROLE_ADDED: 'ROLE_ADDED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  SUPER_ADMIN_ADDED: 'SUPER_ADMIN_ADDED',
  SUPER_ADMIN_REMOVED: 'SUPER_ADMIN_REMOVED',
  
  // Content management
  EXERCISE_CREATED: 'EXERCISE_CREATED',
  EXERCISE_UPDATED: 'EXERCISE_UPDATED',
  EXERCISE_DELETED: 'EXERCISE_DELETED',
  WORKOUT_TEMPLATE_CREATED: 'WORKOUT_TEMPLATE_CREATED',
  WORKOUT_TEMPLATE_UPDATED: 'WORKOUT_TEMPLATE_UPDATED',
  WORKOUT_TEMPLATE_DELETED: 'WORKOUT_TEMPLATE_DELETED',
  DIET_PLAN_CREATED: 'DIET_PLAN_CREATED',
  DIET_PLAN_UPDATED: 'DIET_PLAN_UPDATED',
  DIET_PLAN_DELETED: 'DIET_PLAN_DELETED',
  FOOD_CREATED: 'FOOD_CREATED',
  FOOD_UPDATED: 'FOOD_UPDATED',
  FOOD_DELETED: 'FOOD_DELETED',
  RECIPE_CREATED: 'RECIPE_CREATED',
  RECIPE_UPDATED: 'RECIPE_UPDATED',
  RECIPE_DELETED: 'RECIPE_DELETED',
  
  // Bulk operations
  CONTENT_IMPORTED: 'CONTENT_IMPORTED',
  CONTENT_EXPORTED: 'CONTENT_EXPORTED',
  
  // Settings
  SETTING_UPDATED: 'SETTING_UPDATED',
  
  // Impersonation
  USER_IMPERSONATED: 'USER_IMPERSONATED',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
