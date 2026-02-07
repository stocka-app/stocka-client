import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

interface FormDividerProps {
  className?: string
}

export function FormDivider({ className }: FormDividerProps) {
  const { t } = useTranslation('auth')

  return (
    <div className={cn('relative my-6', className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-4 text-gray-500">{t('or')}</span>
      </div>
    </div>
  )
}
