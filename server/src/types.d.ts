import 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      email?: string | null;
      role?: 'admin' | 'scouter' | 'viewer';
    }
    interface Request {
      user?: User;
    }
  }
}

export {};
