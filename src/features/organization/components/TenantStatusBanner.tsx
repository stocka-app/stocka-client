import { useTranslation } from 'react-i18next';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { TenantStatus } from '../types/organization.types';

interface TenantStatusBannerProps {
  status: TenantStatus;
}

export function TenantStatusBanner({ status }: TenantStatusBannerProps): React.ReactNode {
  const { t } = useTranslation('organization');

  if (status === 'ACTIVE') {
    return null;
  }

  const isSuspended = status === 'SUSPENDED';

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium',
        isSuspended
          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
          : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
      )}
    >
      {isSuspended ? (
        <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      )}
      <span>
        {isSuspended ? t('banners.suspended') : t('banners.cancelled')}
      </span>
    </div>
  );
}
