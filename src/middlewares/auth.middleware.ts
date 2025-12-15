import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader?.split(' ')[1];

  try {
    if(token){
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; 
    next();
    }
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(403).json({ error: 'No user authenticated.' });
    }

    const userRole = (req.user as JwtPayload).role;

    if (!roles.includes(userRole)) {
      res.status(403).json({ error: 'You are not authorized to access this resource.' });
      return;
    }

    next();
  };
};

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: (req: Request) => {
    console.log('Login attempt from:', req.body.email || req.ip);
    return req.body.email || req.ip;
  }
});