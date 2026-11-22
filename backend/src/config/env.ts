import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env from backend/ or monorepo root if present.
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://stepsafe:stepsafe123@localhost:5432/stepsafe"),
  JWT_SECRET: z
    .string()
    .min(16)
    .default("dev-stepsafe-jwt-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  USER_AGENT: z
    .string()
    .default("TugasBesar-TST/1.0 (kelompok-stepsafe-K01)"),
});

export const env = envSchema.parse(process.env);
