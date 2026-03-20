import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RegisterForm } from '../components';
import { cn } from '@/shared/lib/utils';
import { useAuthentication } from '../hooks/useAuthentication';

function RegisterPage() {
  const { t } = useTranslation('authentication');
  const { isLoading, clearError } = useAuthentication();

  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          {t('createYourAccount', 'Create your account')}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {t('haveAccount')}{' '}
          <Link
            to="/authentication/sign-in"
            className={cn(
              'font-semibold text-authentication-highlight hover:underline',
              isLoading && 'pointer-events-none opacity-50',
            )}
          >
            {t('signIn')}
          </Link>
        </p>
      </div>

      {/* Form */}
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;
