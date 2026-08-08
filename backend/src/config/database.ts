import mongoose from "mongoose";
import { env } from "./environment.js";
import { logger } from "./logger.js";

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = env.DATABASE_URL || env.MONGO_URI;
  if (!uri) {
    throw new Error("DATABASE_URL / MONGO_URI environment variable is not defined");
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
    } as any);

    logger.info(`[Database] MongoDB Connected to host: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      logger.warn("[Database] MongoDB Disconnected — Auto-reconnecting...");
    });
    mongoose.connection.on("reconnected", () => {
      logger.info("[Database] MongoDB Reconnected");
    });
    mongoose.connection.on("error", (err) => {
      logger.error(`[Database] MongoDB Connection error: ${err.message}`);
    });

    return conn;
  } catch (err: any) {
    logger.error(`[Database] Failed to connect to MongoDB: ${err.message}`);
    throw err;
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
