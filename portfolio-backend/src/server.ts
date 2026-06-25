import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { testConnection } from './db/pool';
import fs from 'fs';

async function bootstrap() {
  // Ensure tmp upload dir exists
  if (!fs.existsSync('/tmp/uploads')) {
    fs.mkdirSync('/tmp/uploads', { recursive: true });
  }

  // Test DB connection
  await testConnection();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   🚀 Portfolio API Server                        ║
║   Environment : ${env.NODE_ENV.padEnd(28)}   ║
║   Port        : ${String(env.PORT).padEnd(28)}   ║
║   Health      : http://localhost:${env.PORT}/health       ║
╚══════════════════════════════════════════════════╝
    `);
    console.log('📋 Available routes:');
    console.log('  POST   /api/auth/setup');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/settings');
    console.log('  GET    /api/projects');
    console.log('  GET    /api/blog');
    console.log('  GET    /api/skills');
    console.log('  GET    /api/experiences');
    console.log('  GET    /api/social');
    console.log('  GET    /api/tags');
    console.log('  POST   /api/contacts');
    console.log('  POST   /api/analytics/track');
    console.log('  GET    /api/analytics/dashboard  [admin]');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
