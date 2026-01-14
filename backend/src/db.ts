import sql, { ConnectionPool, IResult } from 'mssql';
import { config } from './config';

let pool: ConnectionPool | null = null;

// Initialize database connection pool
export async function initializeDatabase(): Promise<ConnectionPool> {
  if (pool) {
    return pool;
  }

  const sqlConfig: sql.config = {
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    server: config.database.server,
    options: config.database.options,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Get the connection pool
export function getPool(): ConnectionPool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

// ============ JSON Parsing Utilities for Azure SQL ============
// Azure SQL stores JSON as NVARCHAR strings, these helpers safely parse them

/**
 * Parse a JSON field from Azure SQL (stored as NVARCHAR string) to an array or object
 */
export function parseJsonField<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value as T;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    if (value === '' || value === 'null') return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      // If it's a comma-separated string, convert to array
      if (value.includes(',')) {
        return value.split(',').map(s => s.trim()).filter(s => s) as unknown as T;
      }
      return [value] as unknown as T;
    }
  }
  return null;
}

/**
 * Ensure a value is an array - handles SQL Server returning strings
 */
export function ensureArray<T>(value: unknown): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    if (value === '' || value === 'null') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(',').map(s => s.trim()).filter(s => s) as unknown as T[];
    }
  }
  return [value] as unknown as T[];
}

/**
 * Transform a database row by parsing specified JSON fields
 */
export function transformRow<T extends Record<string, unknown>>(
  row: T,
  jsonFields: (keyof T)[],
  arrayFields: (keyof T)[] = []
): T {
  if (!row) return row;
  const result = { ...row };
  for (const field of jsonFields) {
    if (field in result) {
      result[field] = parseJsonField(result[field]) as T[keyof T];
    }
  }
  // Ensure specified fields are always arrays
  for (const field of arrayFields) {
    if (field in result) {
      result[field] = ensureArray(result[field]) as T[keyof T];
    }
  }
  return result;
}

/**
 * Transform multiple database rows by parsing specified JSON fields
 */
export function transformRows<T extends Record<string, unknown>>(
  rows: T[],
  jsonFields: (keyof T)[],
  arrayFields: (keyof T)[] = []
): T[] {
  return rows.map(row => transformRow(row, jsonFields, arrayFields));
}

// ============ Query Utilities ============

// Execute a query with parameters
export async function query<T>(
  queryText: string,
  params?: Record<string, unknown>
): Promise<IResult<T>> {
  const poolConnection = getPool();
  const request = poolConnection.request();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }

  return request.query<T>(queryText);
}

// Execute a query and return first row or null
export async function queryOne<T>(
  queryText: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const result = await query<T>(queryText, params);
  return result.recordset[0] || null;
}

// Execute a query and return all rows
export async function queryAll<T>(
  queryText: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const result = await query<T>(queryText, params);
  return result.recordset;
}

// Execute an INSERT/UPDATE/DELETE and return rows affected
export async function execute(
  queryText: string,
  params?: Record<string, unknown>
): Promise<number> {
  const result = await query(queryText, params);
  return result.rowsAffected[0] || 0;
}

// Close the connection pool
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const poolConnection = getPool();
  const transaction = new sql.Transaction(poolConnection);

  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
