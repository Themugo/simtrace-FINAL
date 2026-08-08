import http from "http";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/environment.js";
import { logger } from "./config/logger.js";
import { initializeWebSocketServer } from "./websocket/socket.server.js";

async function bootstrap() {
  try {
    logger.info("⚡ Initializing SimTrace Enterprise Backend Server...");

    // 1. Connect Database
    await connectDatabase();

    // 2. Initialize Express Application
    const app = createApp();

    // 3. Create HTTP & WebSocket Server
    const server = http.createServer(app);
    initializeWebSocketServer(server);

    // 4. Listen on PORT
    const port = env.PORT;
    server.listen(port, () => {
      logger.info(`🚀 SimTrace Backend running in ${env.NODE_ENV} mode on port ${port}`);
      logger.info(`🔍 Health check available at: http://localhost:${port}/api/health`);
    });

    // Handle graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down server...`);
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err: any) {
    logger.error(`❌ Server startup failed: ${err.message}`);
    process.exit(1);
  }
}

bootstrap();
