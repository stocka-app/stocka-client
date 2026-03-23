import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/components';
import { AuthenticationLayout, AppLayout } from '@/shared/layouts';
import { PublicRoute, ProtectedRoute, RequiresTenantRoute, VerificationRoute } from '@/features/authentication/guards';
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
const OrganizationSettingsPage = lazy(
  () => import('@/features/organization/pages/OrganizationSettingsPage'),
);
const TeamSettingsPage = lazy(() => import('@/features/team/pages/TeamSettingsPage'));
const SpacesPage = lazy(() => import('@/features/spaces/pages/SpacesPage'));
const PrivacySettingsPage = lazy(() => import('@/features/privacy/pages/PrivacySettingsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Navigate to="/authentication/sign-in" replace />
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
        element: <Navigate to="/authentication/sign-in" replace />,
      },
      {
        path: 'sign-in',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'sign-up',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <ErrorBoundary context="inline">
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
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <ResetPasswordPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
    ],
  },
  // ── OAuth callback — outside PublicRoute to avoid redirect race ──
  {
    path: '/authentication/callback',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <OAuthCallbackPage />
        </Suspense>
      </ErrorBoundary>
    ),
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
  // RequiresTenantRoute redirects to /onboarding if tenantId is null in the JWT
  {
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <RequiresTenantRoute>
            <AppLayout />
          </RequiresTenantRoute>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/settings',
        element: <Navigate to="/settings/organization" replace />,
      },
      {
        path: '/settings/organization',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <OrganizationSettingsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/settings/team',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <TeamSettingsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/settings/privacy',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <PrivacySettingsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: '/warehouse',
        element: (
          <ErrorBoundary context="inline">
            <Suspense fallback={<PageLoader />}>
              <SpacesPage />
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
          <h1 className="text-4xl font-bold text-neutral-900">404</h1>
          <p className="mt-2 text-neutral-500">Page not found</p>
          <a href="/authentication/sign-in" className="mt-4 text-primary hover:underline">
            Go to login
          </a>
        </div>
      </ErrorBoundary>
    ),
  },
]);
