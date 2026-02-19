import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/shared/layouts'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAuthStore } from '@/features/auth'

// Lazy load pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })))
const OAuthCallbackPage = lazy(() => import('@/features/auth/pages/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))

// Loading fallback
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

// Protected route wrapper - verifica autenticación y verificación de email
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, emailVerificationRequired } = useAuthStore()

  // Si no está autenticado y no tiene verificación pendiente, ir a login
  if (!isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/auth/login" replace />
  }

  // Si requiere verificación de email, redirigir a la página de verificación
  if (emailVerificationRequired) {
    return <Navigate to="/auth/verify-email" replace />
  }

  return <>{children}</>
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, emailVerificationRequired } = useAuthStore()

  // Si está completamente autenticado (sin verificación pendiente), ir a dashboard
  if (isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Verification route wrapper - solo accesible si tiene verificación pendiente
function VerificationRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, emailVerificationRequired, pendingVerificationEmail } = useAuthStore()

  // Si ya está autenticado completamente, ir a dashboard
  if (isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/dashboard" replace />
  }

  // Si no hay email pendiente de verificar, ir a login
  if (!pendingVerificationEmail) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '/auth',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <VerificationRoute>
            <Suspense fallback={<PageLoader />}>
              <VerifyEmailPage />
            </Suspense>
          </VerificationRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'callback',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OAuthCallbackPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <DashboardPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-600">Page not found</p>
        <a href="/auth/login" className="mt-4 text-primary hover:underline">
          Go to login
        </a>
      </div>
    ),
  },
])
