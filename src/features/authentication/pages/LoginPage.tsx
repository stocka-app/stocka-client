import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components';
import { cn } from '@/shared/lib/utils';
import { useAuthentication } from '../hooks/useAuthentication';

function LoginPage() {
  const { t } = useTranslation('authentication');
  const { isLoading, clearError } = useAuthentication();

  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
          {t('signIn')}
        </h1>
        <p className="mt-1 sm:mt-2 text-sm text-neutral-500">
          {t('noAccount')}{' '}
          <Link
            to="/authentication/sign-up"
            className={cn(
              'font-semibold text-authentication-highlight hover:underline',
              isLoading && 'pointer-events-none opacity-50',
            )}
          >
            {t('createAccount', 'Create an account')}
          </Link>
        </p>
      </div>

      {/* Form */}
      <LoginForm />
    </div>
  );
}

export default LoginPage;
