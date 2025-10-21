import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define User interface
export interface User {
  id: number; // Changed from string to number to match Express.User
  email?: string | null;
  name: string;
  readonly isAdmin?: boolean;
}

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface User {
      id: number;
      email?: string | null;
      name: string;
      readonly isAdmin?: boolean;
    }
    
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to verify admin JWT token
 */
export const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'saxon-scout-secret') as Express.User;
    
    // Verify that the user has admin role
    if (!decoded || !decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * Middleware to verify regular user JWT token
 */
// Alias for verifyToken for better semantics
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  return verifyToken(req, res, next);
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'saxon-scout-secret') as Express.User;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};