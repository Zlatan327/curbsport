import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    schoolId: number;
    alias: string;
  };
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isDefaultOrWeak =
    !secret ||
    secret === 'fallback-secret' ||
    secret === 'change-this-to-a-random-secret-in-production';

  if (isDefaultOrWeak) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: A strong JWT_SECRET must be configured in production environment.');
    }
    return secret || 'inside-life-dev-secret-change-in-prod';
  }
  return secret;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: number;
      schoolId: number;
      alias: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}
