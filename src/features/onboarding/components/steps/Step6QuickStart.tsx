import { useTranslation } from 'react-i18next';
import { Loader2, Package, Users, Warehouse, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Step6QuickStartProps {
  onComplete: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CHECKLIST_ITEMS = [
  { icon: Package, labelKey: 'step6.item1' },
  { icon: Users, labelKey: 'step6.item2' },
  { icon: Warehouse, labelKey: 'step6.item3' },
  { icon: BarChart3, labelKey: 'step6.item4' },
];

function SuccessIllustration(): React.ReactElement {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="40" className="fill-brand-light" />
      <circle cx="40" cy="40" r="28" className="fill-brand/30" />
      <circle cx="40" cy="40" r="18" className="fill-brand" />
      <path
        d="M30 40L37 47L50 33"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Step6QuickStart({
  onComplete,
  isLoading,
  error,
}: Step6QuickStartProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      {/* API error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger-bg border border-danger/30 p-3 text-sm text-danger"
        >
          {t(error)}
        </div>
      )}

      {/* Success illustration */}
      <div className="flex justify-center">
        <SuccessIllustration />
      </div>

      {/* Success message */}
      <p className="text-sm text-neutral-500 text-center">{t('step6.successMessage')}</p>

      {/* Checklist */}
      <div>
        <p className="text-sm font-medium text-neutral-500 mb-4">{t('step6.checklistTitle')}</p>
        <ul className="space-y-3" aria-label={t('step6.checklistTitle')}>
          {CHECKLIST_ITEMS.map(({ icon: Icon, labelKey }) => (
            <li key={labelKey} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-light border border-neutral-200 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-brand" aria-hidden="true" />
              </div>
              <span className="text-sm text-neutral-700">{t(labelKey)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <Button
        type="button"
        onClick={onComplete}
        disabled={isLoading}
        aria-label={t('step6.ctaButton')}
        className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {t('common.loading')}
          </>
        ) : (
          t('step6.ctaButton')
        )}
      </Button>
    </div>
  );
}
