import { z } from 'zod'

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'errors.emailOrUsernameRequired'),
  password: z
    .string()
    .min(1, 'errors.passwordRequired')
    .min(8, 'errors.passwordMinLength'),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'errors.emailRequired')
    .email('errors.emailInvalid'),
  username: z
    .string()
    .min(1, 'errors.usernameRequired')
    .min(3, 'errors.usernameMinLength')
    .regex(/^[a-zA-Z0-9_]+$/, 'errors.usernamePattern'),
  password: z
    .string()
    .min(1, 'errors.passwordRequired')
    .min(8, 'errors.passwordMinLength')
    .regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'errors.passwordPattern'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
