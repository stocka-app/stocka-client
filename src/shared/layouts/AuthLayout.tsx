import { Outlet } from 'react-router-dom'
import { Package, BarChart3, TrendingUp } from 'lucide-react'
import { Logo } from '@/shared/components/Logo'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { Card } from '@/shared/components/ui/card'
import { useTranslation } from 'react-i18next'
import { InventoryIllustration, BusinessAnalyticsIllustration } from '@/shared/components/illustrations'

export function AuthLayout() {
  const { t } = useTranslation('auth')
  
  return (
    <div className="min-h-screen w-full">
      {/* Mobile layout */}
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-100 to-blue-50 lg:hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4">
          <Logo size="md" />
          <LanguageSwitcher />
        </header>
        
        {/* Content */}
        <main className="flex flex-1 items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md bg-white p-6 shadow-lg sm:p-8">
            <Outlet />
          </Card>
        </main>
      </div>

      {/* Desktop layout */}
      <div className="hidden min-h-screen lg:flex">
        {/* Left side - Gradient background with illustration */}
        <div className="relative flex w-2/5 flex-col bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 p-8 overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <Logo size="lg" />
            <LanguageSwitcher />
          </div>
          
          {/* Main illustration */}
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <InventoryIllustration className="w-full max-w-sm h-auto" />
            
            {/* Icon cards row */}
            <div className="flex gap-6 mt-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="text-center mt-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {t('inventoryControlSystem')}
              </h2>
              <p className="mt-2 text-gray-600">
                {t('simplifyYourBusinessManagement')}
              </p>
            </div>
          </div>
          
          {/* Background decorative elements */}
          <div className="absolute top-20 right-10 w-20 h-20 bg-blue-200/30 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl" />
        </div>

        {/* Right side - Form with analytics illustration */}
        <div className="flex flex-1 flex-col bg-gray-50 p-8 relative overflow-hidden">
          {/* Small analytics illustration in corner */}
          <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
            <BusinessAnalyticsIllustration className="w-48 h-auto" />
          </div>
          
          <div className="flex flex-1 items-center justify-center relative z-10">
            <Card className="w-full max-w-md bg-white p-8 shadow-lg">
              <Outlet />
            </Card>
          </div>
          
          {/* Bottom decorative illustration */}
          <div className="absolute bottom-0 left-0 opacity-10 pointer-events-none">
            <BusinessAnalyticsIllustration className="w-64 h-auto transform -scale-x-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
