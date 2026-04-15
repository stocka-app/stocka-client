import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().min(1, 'VITE_API_URL is required'),
  VITE_APP_NAME: z.string().min(1, 'VITE_APP_NAME is required'),
  VITE_APP_VERSION: z.string().min(1, 'VITE_APP_VERSION is required'),
  // H-07: permanent delete is UX-complete but the full flow lives in a later
  // story. Flag keeps the entry point visible in dev/staging (exercises the
  // 501 stub) and hidden in production. Default false so prod bundles omit it
  // unless explicitly opted in.
  VITE_STORAGE_DELETE_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

const result = envSchema.safeParse(import.meta.env);

if (!result.success) {
  const missing = result.error.issues
    .map((issue) => `  - ${String(issue.path[0])}: ${issue.message}`)
    .join('\n');
  console.error(
    `[Stocka] ❌ Invalid environment configuration:\n${missing}\n\nCheck your .env file.`,
  );
  throw new Error('Application cannot start: invalid environment configuration');
}

export const env = result.data;
export type Env = z.infer<typeof envSchema>;
