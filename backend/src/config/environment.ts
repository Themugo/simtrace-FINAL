import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("4000"),
  DATABASE_URL: z.string().default(process.env.MONGO_URI || "mongodb://localhost:27017/simtrace"),
  MONGO_URI: z.string().default(process.env.DATABASE_URL || "mongodb://localhost:27017/simtrace"),
  JWT_SECRET: z.string().default("simtrace-super-secret-jwt-key-2026-enterprise"),
  JWT_EXPIRATION: z.string().default("7d"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  EMAIL_PROVIDER: z.string().default("sendgrid"),
  SMS_PROVIDER: z.string().default("africastalking"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(): Environment {
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment configuration:", result.error.format());
    throw new Error("Invalid environment configuration. Check backend/.env file.");
  }
  return result.data;
}

export const env = validateEnvironment();
