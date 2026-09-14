import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  VAPI_API_KEY: z.string().min(1),
  VAPI_WEBHOOK_SECRET: z.string().min(16),
  // Guards the /admin routes. When blank the routes stay open for local dev,
  // and the guard logs a warning once so it is never silently unprotected.
  ADMIN_API_KEY: z.string().optional().default(''),
});

export type Env = z.infer<typeof schema>;

/**
 * Fails the boot loudly on a missing or malformed variable instead of letting
 * a bad value surface as a runtime error on the first phone call.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n  ${issues.join('\n  ')}`);
  }
  return result.data;
}
