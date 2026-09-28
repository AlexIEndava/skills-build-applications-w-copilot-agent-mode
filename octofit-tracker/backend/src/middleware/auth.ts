import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const jwtSecret = process.env.JWT_SECRET || 'octofit-local-development-secret-change-me';

export function createToken(userId: string) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}

export const requireAuth: RequestHandler = (request, response, next) => {
  const authorization = request.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    response.status(401).json({ message: 'Sign in to continue.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      response.status(401).json({ message: 'Your session is invalid. Sign in again.' });
      return;
    }
    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: 'Your session has expired. Sign in again.' });
  }
};