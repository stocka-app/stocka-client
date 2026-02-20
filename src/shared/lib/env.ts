import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().min(1, 'VITE_API_URL is required'),
  VITE_APP_NAME: z.string().min(1, 'VITE_APP_NAME is required'),
  VITE_APP_VERSION: z.string().min(1, 'VITE_APP_VERSION is required'),
})

const result = envSchema.safeParse(import.meta.env)

if (!result.success) {
  const missing = result.error.issues
    .map((issue) => `  - ${String(issue.path[0])}: ${issue.message}`)
    .join('\n')
  console.error(
    `[Stocka] ❌ Invalid environment configuration:\n${missing}\n\nCheck your .env file.`,
  )
  throw new Error('Application cannot start: invalid environment configuration')
}

export const env = result.data
export type Env = z.infer<typeof envSchema>
