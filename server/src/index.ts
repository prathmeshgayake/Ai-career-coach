import { app } from './app';
import { config } from './config';
import { monitorService } from './services/monitor';

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 AI Career Coach backend listening on port ${config.port} (env: ${config.nodeEnv})`);
  console.log(`📡 Health endpoint available at http://localhost:${config.port}/api/v1/health`);

  // Start background repository change polling scheduler
  monitorService.start();
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  monitorService.stop();
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forcefully exiting after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
