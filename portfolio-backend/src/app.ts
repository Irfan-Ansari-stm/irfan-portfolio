import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import settingsRoutes from './modules/settings/settings.routes';
import socialRoutes from './modules/social/social.routes';
import tagsRoutes from './modules/tags/tags.routes';
import skillsRoutes from './modules/skills/skills.routes';
import experiencesRoutes from './modules/experiences/experiences.routes';
import projectsRoutes from './modules/projects/projects.routes';
import blogRoutes from './modules/blog/blog.routes';
import contactsRoutes from './modules/contacts/contacts.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

export function createApp(): Application {
  const app = express();

  // ── Security ────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Body parsing ────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging ─────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // ── Rate limiting ───────────────────────────────────────────
  app.use('/api', globalRateLimiter);

  // ── Serve /tmp/uploads for local dev (not needed in prod) ───
  app.use('/uploads', express.static(path.join('/tmp', 'uploads')));

  // ── Health check ────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // ── API Routes ───────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/social', socialRoutes);
  app.use('/api/tags', tagsRoutes);
  app.use('/api/skills', skillsRoutes);
  app.use('/api/experiences', experiencesRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // ── 404 + Global error handler ───────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
