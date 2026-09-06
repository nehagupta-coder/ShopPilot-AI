import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env") });
dotenv.config({ path: path.resolve(here, "../../.env") });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "memory",
  jwtSecret: process.env.JWT_SECRET ?? "shopilot-dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  aiProvider: (process.env.AI_PROVIDER ?? "mock").toLowerCase(),
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "gpt-4o-mini",
  aiBaseUrl: process.env.AI_BASE_URL ?? "",
};

export function isMockAI(): boolean {
  if (env.aiProvider === "mock") return true;
  if (!env.aiApiKey) return true;
  return false;
}
