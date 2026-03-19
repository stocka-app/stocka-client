import { useTranslation } from 'react-i18next';
import { Warehouse, Lock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface Step4SpacesProps {
  tier: string | null | undefined;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function Step4Spaces({
  tier,
  onContinue,
  onSkip,
  onBack,
  isLoading,
}: Step4SpacesProps): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const isFreeTier = !tier || tier === 'FREE';

  return (
    <div className="space-y-6">
      {/* Warehouse card */}
      <div
        className={cn(
          'p-5 rounded-xl border-2 transition-colors',
          isFreeTier
            ? 'border-[#e5e7eb] bg-[#F3F4F6] opacity-75'
            : 'border-[#3b82f6] bg-blue-50',
        )}
        aria-label={t('step4.warehouseCardTitle')}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              isFreeTier ? 'bg-[#e5e7eb]' : 'bg-[#3b82f6]',
            )}
          >
            {isFreeTier ? (
              <Lock className="w-5 h-5 text-[#6b7280]" aria-hidden="true" />
            ) : (
              <Warehouse className="w-5 h-5 text-white" aria-hidden="true" />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'font-semibold text-sm',
                  isFreeTier ? 'text-[#6b7280]' : 'text-[#111827]',
                )}
              >
                {t('step4.warehouseCardTitle')}
              </p>
              {isFreeTier && (
                <span className="text-xs font-semibold bg-[#f97316] text-white px-2 py-0.5 rounded-full">
                  {t('step4.proBadge')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {isFreeTier ? t('step4.lockedMessage') : t('step4.warehouseCardDescription')}
            </p>
            {isFreeTier && (
              <p className="text-xs text-[#6b7280] mt-2">{t('step4.lockedDescription')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Free tier note */}
      {isFreeTier && (
        <p className="text-xs text-[#6b7280] text-center">{t('step4.freeTierNote')}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          aria-label={t('common.back')}
          className="flex-1 h-12 rounded-xl border-[#e5e7eb] text-[#6b7280]"
        >
          {t('common.back')}
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          disabled={isLoading}
          aria-label={t('step4.ctaButton')}
          className="flex-1 h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold"
        >
          {t('step4.ctaButton')}
        </Button>
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          aria-label={t('step4.skipLink')}
          className="text-sm text-[#6b7280] hover:text-[#3b82f6] hover:underline transition-colors disabled:pointer-events-none"
        >
          {t('step4.skipLink')}
        </button>
      </div>
    </div>
  );
}
