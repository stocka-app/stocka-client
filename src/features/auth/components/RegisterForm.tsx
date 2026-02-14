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
import { registerSchema, type RegisterFormData } from '../schemas/auth.schema'
import { useAuth } from '../hooks/useAuth'

export function RegisterForm() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { register, isLoading, error, errorCode, clearError } = useAuth()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      const result = await register(data)

      // Registro siempre requiere verificación de email
      if (result?.requiresVerification) {
        navigate('/auth/verify-email')
      } else {
        navigate('/dashboard')
      }
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
            {errorCode === 'EMAIL_ALREADY_EXISTS' && (
              <>
                {' '}
                <Link
                  to="/auth/login"
                  className="font-medium underline hover:no-underline"
                  onClick={clearError}
                >
                  {t('signIn')}
                </Link>
              </>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.email?.message &&
                  t(form.formState.errors.email.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('username')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('usernamePlaceholder')}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.username?.message &&
                  t(form.formState.errors.username.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password')}</FormLabel>
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
              {t('creatingAccount')}
            </>
          ) : (
            t('signUpButton')
          )}
        </Button>

        <FormDivider />

        <div className="flex gap-3">
          <SocialButton
            provider="google"
            label={t('signUpWithGoogle')}
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
