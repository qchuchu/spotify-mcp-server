import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { z } from "zod";

dotenvExpand.expand(dotenv.config());

const EnvSchema = z.object({
  MCP_HTTP_PORT: z.coerce.number().int().positive().default(3000),
  MCP_HTTP_URL: z.string().min(1, "MCP_HTTP_URL is required"),
  MCP_HTTP_HOST: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().min(1, "SPOTIFY_CLIENT_ID is required"),
  OAUTH_ISSUER_URL: z.string().min(1, "OAUTH_ISSUER_URL is required"),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  if (process.stdout.isTTY) {
    console.error("❌ Invalid environment variables found:", parsedEnv.error.flatten().fieldErrors);
  }
  process.exit(1);
}

export const config = parsedEnv.data;
