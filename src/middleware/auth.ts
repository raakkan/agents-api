import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from './errorHandler';

export const auth = (req: Request, _res: Response, next: NextFunction) => {
  // If API_KEY is not set, API runs in self-hosted open mode
  if (!env.API_KEY) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized: Missing or invalid Authorization header format. Expected: "Authorization: Bearer <API_KEY>"'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new ApiError(401, 'Unauthorized: Empty bearer token provided'));
  }

  // Timing-safe equal comparison to prevent side-channel timing attacks
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(env.API_KEY);

  if (
    tokenBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
  ) {
    return next(new ApiError(403, 'Forbidden: Invalid API key'));
  }

  next();
};
