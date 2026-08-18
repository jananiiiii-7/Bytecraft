import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

const cwd = process.cwd();
const serverEnv = cwd.endsWith("/server") ? path.resolve(cwd, ".env") : path.resolve(cwd, "server/.env");
dotenv.config({ path: serverEnv });
dotenv.config({ path: path.resolve(cwd, ".env") });

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  BYTECRAFT_DEMO_MODE: z.string().default("false"),
});

export const env = envSchema.parse(process.env);
