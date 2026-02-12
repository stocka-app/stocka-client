import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { PasswordInput } from './PasswordInput'
import { SocialButton } from './SocialButton'
import { FormDivider } from './FormDivider'
import { loginSchema, type LoginFormData } from '../schemas/auth.schema'
import { useAuth } from '../hooks/useAuth'
import { cn } from '@/shared/lib/utils'

export function LoginForm() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { login, isLoading, error, errorCode, clearError, setPendingVerificationEmail } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  })

  // Guardar el email para verificación cuando hay error EMAIL_NOT_VERIFIED
  const handleVerifyEmailClick = () => {
    const emailOrUsername = form.getValues('emailOrUsername')
    if (emailOrUsername.includes('@')) {
      setPendingVerificationEmail(emailOrUsername)
    }
    clearError()
    navigate('/auth/verify-email')
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      const result = await login(data)

      // Solo redirigir a dashboard si login exitoso (usuario verificado)
      if (!result?.requiresVerification) {
        navigate('/dashboard')
      }
      // Si requiresVerification es true, el error se mostrará con el link
    } catch {
      // Los errores se muestran en el formulario con links según el tipo
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <span>{t(`errors.${errorCode}`, { defaultValue: error })}</span>
            {errorCode === 'EMAIL_NOT_VERIFIED' && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={handleVerifyEmailClick}
                  className="font-medium underline hover:no-underline"
                >
                  {t('verifyEmail.verifyNow', 'Verify now')}
                </button>
              </>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="emailOrUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailOrUsername')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('emailOrUsernamePlaceholder')}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.emailOrUsername?.message &&
                  t(form.formState.errors.emailOrUsername.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t('password')}</FormLabel>
                <Link
                  to="/auth/forgot-password"
                  className={cn(
                    'text-sm text-primary hover:underline',
                    isLoading && 'pointer-events-none opacity-50'
                  )}
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder={t('passwordPlaceholder')}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.password?.message &&
                  t(form.formState.errors.password.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('signingIn')}
            </>
          ) : (
            t('signInButton')
          )}
        </Button>

        <FormDivider />

        <div className="flex gap-3">
          <SocialButton
            provider="google"
            label={t('signInWithGoogle')}
            variant="full"
            className="flex-1"
          />
          <SocialButton provider="facebook" variant="icon" />
          <SocialButton provider="microsoft" variant="icon" />
        </div>
      </form>
    </Form>
  )
}
