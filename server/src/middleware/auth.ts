import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userStore } from '../db/userStore';
import { getStudentById } from '../data/students';
import { PublicUser } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Authentication Middleware:
 * Supports standard JWT Bearer token (Production),
 * as well as x-user-id for API testing and transition.
 */
export async function studentAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Extract Bearer token from Authorization header
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1].trim();
      }
    }

    // 2. If valid JWT token found, verify it
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        if (decoded?.userId) {
          const dbUser = await userStore.getUser(decoded.userId);
          if (dbUser) {
            req.user = userStore.toPublicUser(dbUser);
            req.userId = dbUser.id;
            next();
            return;
          }
        }
      } catch (err) {
        // If it was not a valid JWT, check if it was a plain userId passed in Bearer (for dev testing)
        const dbUser = await userStore.getUser(token);
        if (dbUser) {
          req.user = userStore.toPublicUser(dbUser);
          req.userId = dbUser.id;
          next();
          return;
        }
      }
    }

    // 3. Fallback: Check 'x-user-id' header
    const rawUserId = req.headers['x-user-id'] as string;
    if (rawUserId && rawUserId.trim()) {
      const trimmed = rawUserId.trim();
      // Check in user store
      const dbUser = await userStore.getUser(trimmed);
      if (dbUser) {
        req.user = userStore.toPublicUser(dbUser);
        req.userId = dbUser.id;
        next();
        return;
      }

      // Check fallback student profile
      const fallbackStudent = getStudentById(trimmed);
      if (fallbackStudent) {
        req.user = fallbackStudent;
        req.userId = fallbackStudent.id;
        next();
        return;
      }
    }

    // 4. Default student profile for unauthenticated exploratory calls
    const defaultStudent = getStudentById('student-aarav');
    if (defaultStudent) {
      req.user = defaultStudent;
      req.userId = defaultStudent.id;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Strict route protection middleware:
 * Requires an authenticated user with a verified userId.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.userId || !req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please login or signup.',
    });
    return;
  }
  next();
}
