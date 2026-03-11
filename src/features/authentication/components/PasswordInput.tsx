import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

export type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const { t } = useTranslation('common');
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 dark:text-neutral-500 pointer-events-none">
          lock
        </span>
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('h-12 rounded-lg pl-10 pr-10 bg-white dark:bg-authentication-input-bg border-slate-300 dark:border-authentication-input-border', className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-lg text-neutral-400 dark:text-neutral-500" aria-hidden="true">
            {showPassword ? 'visibility' : 'visibility_off'}
          </span>
          <span className="sr-only">{showPassword ? t('hidePassword') : t('showPassword')}</span>
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
