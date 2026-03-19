import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/components';
import { AuthenticationLayout, AppLayout } from '@/shared/layouts';
import { PublicRoute, ProtectedRoute, VerificationRoute } from '@/features/authentication/guards';
import { OnboardingGuard } from '@/features/onboarding';
import { PageLoader } from '@/app/page-loader';

const LoginPage = lazy(() => import('@/features/authentication/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/authentication/pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/features/authentication/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/features/authentication/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/authentication/pages/ResetPasswordPage'));
const OAuthCallbackPage = lazy(() => import('@/features/authentication/pages/OAuthCallbackPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/OnboardingPage'));
const TeamSettingsPage = lazy(() => import('@/features/team/pages/TeamSettingsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Navigate to="/authentication/login" replace />
      </ErrorBoundary>
    ),
  },
  {
    path: '/authentication',
    element: (
      <ErrorBoundary>
        <PublicRoute>
          <AuthenticationLayout />
        </PublicRoute>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <ErrorBoundary>
            <Navigate to="/authentication/login" replace />
          </ErrorBoundary>
        ),
      },
      {
        path: 'login',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'register',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <ErrorBoundary>
            <VerificationRoute>
              <Suspense fallback={<PageLoader />}>
                <VerifyEmailPage />
              </Suspense>
            </VerificationRoute>
          </ErrorBoundary>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ResetPasswordPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'callback',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <OAuthCallbackPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
    ],
  },
  // ── Onboarding — protected but outside AppLayout ──
  {
    path: '/onboarding',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <OnboardingGuard>
            <Suspense fallback={<PageLoader />}>
              <OnboardingPage />
            </Suspense>
          </OnboardingGuard>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  // ── Authenticated shell: all post-login routes nested under AppLayout ──
  {
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/settings/team',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <TeamSettingsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="mt-2 text-gray-600">Page not found</p>
          <a href="/authentication/login" className="mt-4 text-primary hover:underline">
            Go to login
          </a>
        </div>
      </ErrorBoundary>
    ),
  },
]);
