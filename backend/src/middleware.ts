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
    const decoded = jwt.verify(token, config.jwt_secret) as unknown as { userId: number; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const generateToken = (userId: number, email: string) => {
  if (!config.jwt_secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const secondsUntilEndOfDay = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
  
  return jwt.sign({ userId, email }, config.jwt_secret, { expiresIn: secondsUntilEndOfDay });
};
