import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from './config';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!config.jwt_secret) {
    return res.status(500).json({ error: 'JWT_SECRET not configured' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt_secret) as unknown as {
      userId?: unknown;
      email?: unknown;
    };
    if (typeof decoded.userId !== 'number' || typeof decoded.email !== 'string') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Fixed session lifetime, so a login near midnight doesn't expire almost instantly.
const TOKEN_TTL = '7d';

export const generateToken = (userId: number, email: string) => {
  if (!config.jwt_secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign({ userId, email }, config.jwt_secret, { expiresIn: TOKEN_TTL });
};
