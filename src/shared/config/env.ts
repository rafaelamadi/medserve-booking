import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL (Supabase pooled) is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL (Supabase direct, for migrations) is required").optional(),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required").optional(),
  NEXTAUTH_URL: z.string().optional(),
  ALLOW_DEV_AUTH: z.string().optional(),
  APP_URL: z.string().optional(),
  // SMS & WhatsApp logic commented out; using Email (Resend) for notifications
  // SMS_SENDER: z.string().optional(),
  // TERMII_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  WORDPRESS_URL: z.string().optional(),
  CMS_WEBHOOK_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid env: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
}
