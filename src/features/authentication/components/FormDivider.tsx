import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

interface FormDividerProps {
  className?: string;
}

export function FormDivider({ className }: FormDividerProps) {
  const { t } = useTranslation('authentication');

  return (
    <div className={cn('relative my-3 sm:my-6', className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-authentication-surface dark:bg-authentication-right-panel px-4 uppercase tracking-wider text-neutral-400">
          {t('orContinueWith', 'Or continue with')}
        </span>
      </div>
    </div>
  );
}
