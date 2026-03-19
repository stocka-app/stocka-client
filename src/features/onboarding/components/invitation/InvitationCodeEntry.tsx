import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { invitationCodeSchema, type InvitationCodeFormData } from '../../schemas/onboarding.schema';

interface InvitationCodeEntryProps {
  onValidate: (code: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function InvitationCodeEntry({
  onValidate,
  onBack,
  isLoading,
  error,
}: InvitationCodeEntryProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  const form = useForm<InvitationCodeFormData>({
    resolver: zodResolver(invitationCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const handleSubmit = async (data: InvitationCodeFormData): Promise<void> => {
    await onValidate(data.code);
  };

  const handleCodeChange = (
    value: string,
    onChange: (value: string) => void,
  ): void => {
    onChange(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
  };

  const isExpiredError = error === 'invitation.codeEntry.errors.EXPIRED_CODE';
  const errorColor = isExpiredError ? 'text-[#f97316]' : 'text-[#ef4444]';
  const errorBg = isExpiredError ? 'bg-[#fff7ed] border-[#f97316]/30' : 'bg-[#fef2f2] border-[#ef4444]/30';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* API error */}
        {error && (
          <div
            role="alert"
            className={`rounded-lg border p-3 text-sm ${errorBg} ${errorColor}`}
          >
            {t(error)}
          </div>
        )}

        {/* Code input */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#111827]">
                {t('invitation.codeEntry.codeLabel')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('invitation.codeEntry.codePlaceholder')}
                  disabled={isLoading}
                  className="h-14 rounded-xl border-[#e5e7eb] text-center text-2xl font-mono tracking-widest uppercase"
                  maxLength={8}
                  aria-label={t('invitation.codeEntry.codeLabel')}
                  {...field}
                  onChange={(e) => handleCodeChange(e.target.value, field.onChange)}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.code?.message && t(form.formState.errors.code.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* CTA */}
        <Button
          type="submit"
          disabled={isLoading}
          aria-label={t('invitation.codeEntry.ctaButton')}
          className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('invitation.codeEntry.validating')}
            </>
          ) : (
            t('invitation.codeEntry.ctaButton')
          )}
        </Button>

        {/* Back link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            aria-label={t('invitation.codeEntry.backLink')}
            className="text-sm text-[#6b7280] hover:text-[#3b82f6] hover:underline transition-colors disabled:pointer-events-none"
          >
            {t('invitation.codeEntry.backLink')}
          </button>
        </div>
      </form>
    </Form>
  );
}
