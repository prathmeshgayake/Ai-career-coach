import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { generalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import healthRoutes from './routes/health';
import jobsRoutes from './routes/jobs';
import analysesRoutes from './routes/analyses';
import trackedReposRoutes from './routes/trackedRepos';
import internalRoutes from './routes/internal';
import repositoriesRoutes from './routes/repositories';
import authRoutes from './routes/auth';
import { studentAuthMiddleware } from './middleware/auth';

export function createApp(): Express {
  const app = express();

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman) or matching allowed origins
        if (!origin || config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-poll-secret', 'x-user-id'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General rate limiter
  app.use('/api', generalRateLimiter);

  // API Routes
  app.use('/api/v1/health', healthRoutes);
  
  // Student multi-tenant authentication middleware for API routes
  app.use('/api/v1', studentAuthMiddleware);
  
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/jobs', jobsRoutes);
  app.use('/api/v1/analyses', analysesRoutes);
  app.use('/api/v1/tracked-repositories', trackedReposRoutes);
  app.use('/api/v1/repositories', repositoriesRoutes);
  app.use('/api/v1/internal', internalRoutes);

  // Production: Serve React frontend static files and handle SPA client-side routing
  const clientDistPaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ];
  const clientDist = clientDistPaths.find((p) => fs.existsSync(p));

  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req: Request, res: Response, next) => {
      // Don't intercept API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 handler for API routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
