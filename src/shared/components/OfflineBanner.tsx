import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useOfflineStatus } from '@/shared/hooks/useOfflineStatus';

interface OfflineBannerProps {
  /** Extra Tailwind classes merged onto the root container. */
  className?: string;
}

/**
 * OfflineBanner
 *
 * Top-of-page banner shown while the browser reports no network
 * connectivity. Self-contained: reads `isOffline` directly from
 * `useOfflineStatus`, so consumers just drop `<OfflineBanner />` above
 * their main content. Renders nothing while online.
 *
 * Uses the `common` i18n namespace (keys `offline.bannerTitle` and
 * `offline.bannerDescription`) with Spanish defaults inline so the
 * banner works even before the keys are authored.
 */
export function OfflineBanner({ className }: OfflineBannerProps): React.ReactElement | null {
  const { t } = useTranslation('common');
  const { isOffline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground',
        className,
      )}
    >
      <span className="material-symbols-outlined text-[20px] leading-none text-warning">
        cloud_off
      </span>
      <div className="flex-1">
        <p className="font-medium">
          {t('offline.bannerTitle', { defaultValue: 'Sin conexión' })}
        </p>
        <p className="text-muted-foreground">
          {t('offline.bannerDescription', {
            defaultValue:
              'Algunas acciones están desactivadas hasta que recuperes conexión.',
          })}
        </p>
      </div>
    </div>
  );
}
