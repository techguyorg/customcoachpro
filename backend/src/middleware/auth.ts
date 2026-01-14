import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { queryOne, queryAll } from '../db';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    fullName?: string;
  };
}

// Verify JWT token and attach user to request
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Get user roles from database
    const roles = await queryAll<{ role: string }>(
      'SELECT role FROM user_roles WHERE user_id = @userId',
      { userId: payload.userId }
    );

    // Get user's full name from profiles
    const profile = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM profiles WHERE user_id = @userId',
      { userId: payload.userId }
    );

    req.user = {
      id: payload.userId,
      email: payload.email,
      roles: roles.map(r => r.role),
      fullName: profile?.full_name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const roles = await queryAll<{ role: string }>(
      'SELECT role FROM user_roles WHERE user_id = @userId',
      { userId: payload.userId }
    );

    // Get user's full name from profiles
    const profile = await queryOne<{ full_name: string }>(
      'SELECT full_name FROM profiles WHERE user_id = @userId',
      { userId: payload.userId }
    );

    req.user = {
      id: payload.userId,
      email: payload.email,
      roles: roles.map(r => r.role),
      fullName: profile?.full_name,
    };
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

// Require specific role(s)
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Check if user is a coach
export function requireCoach(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.roles.includes('coach')) {
    res.status(403).json({ error: 'Coach access required' });
    return;
  }
  next();
}

// Check if user is a super admin
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.roles.includes('super_admin')) {
    res.status(403).json({ error: 'Super admin access required' });
    return;
  }
  next();
}

// Check if user is coach of a specific client
export async function isCoachOfClient(coachId: string, clientId: string): Promise<boolean> {
  const relationship = await queryOne<{ id: string }>(
    `SELECT id FROM coach_client_relationships 
     WHERE coach_id = @coachId AND client_id = @clientId AND status = 'active'`,
    { coachId, clientId }
  );
  return !!relationship;
}
