

import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/components';
import { AuthLayout } from '@/shared/layouts';
import { PublicRoute, ProtectedRoute, VerificationRoute } from '@/features/auth/guards';
import { PageLoader } from '@/app/page-loader';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const OAuthCallbackPage = lazy(() => import('@/features/auth/pages/OAuthCallbackPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Navigate to="/auth/login" replace />
      </ErrorBoundary>
    ),
  },
  {
    path: '/auth',
    element: (
      <ErrorBoundary>
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <ErrorBoundary>
            <Navigate to="/auth/login" replace />
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
  {
    path: '/dashboard',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="mt-2 text-gray-600">Page not found</p>
          <a href="/auth/login" className="mt-4 text-primary hover:underline">
            Go to login
          </a>
        </div>
      </ErrorBoundary>
    ),
  },
]);
