import { useTranslation } from 'react-i18next';
import { Loader2, Package, Users, Warehouse, BarChart3 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Step6QuickStartProps {
  onComplete: () => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CHECKLIST_ITEMS = [
  { icon: Package, labelKey: 'step6.item1' },
  { icon: Users, labelKey: 'step6.item2' },
  { icon: Warehouse, labelKey: 'step6.item3' },
  { icon: BarChart3, labelKey: 'step6.item4' },
];

export function Step6QuickStart({
  onComplete,
  onSkip,
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
          className="rounded-lg bg-[#fef2f2] border border-[#ef4444]/30 p-3 text-sm text-[#ef4444]"
        >
          {t(error)}
        </div>
      )}

      {/* Checklist */}
      <div>
        <p className="text-sm font-medium text-[#6b7280] mb-4">{t('step6.checklistTitle')}</p>
        <ul className="space-y-3" aria-label={t('step6.checklistTitle')}>
          {CHECKLIST_ITEMS.map(({ icon: Icon, labelKey }) => (
            <li key={labelKey} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-[#e5e7eb] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[#3b82f6]" aria-hidden="true" />
              </div>
              <span className="text-sm text-[#374151]">{t(labelKey)}</span>
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
        className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-base"
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

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          aria-label={t('step6.skipLink')}
          className="text-sm text-[#6b7280] hover:text-[#3b82f6] hover:underline transition-colors disabled:pointer-events-none"
        >
          {t('step6.skipLink')}
        </button>
      </div>
    </div>
  );
}
