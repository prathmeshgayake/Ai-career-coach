import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function pollAuth(req: Request, res: Response, next: NextFunction): void {
  const secretHeader = req.headers['x-poll-secret'];
  const authHeader = req.headers['authorization'];

  let token: string | undefined;

  if (typeof secretHeader === 'string' && secretHeader) {
    token = secretHeader;
  } else if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token || token !== config.pollSecret) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid or missing poll secret',
    });
    return;
  }

  next();
}
