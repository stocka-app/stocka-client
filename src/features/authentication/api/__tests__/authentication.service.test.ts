import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/shared/lib/axios';
import { authenticationService } from '../authentication.service';

vi.mock('@/shared/lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/shared/lib/env', () => ({
  env: { VITE_API_URL: 'http://localhost:3000' },
}));

const mockedApi = vi.mocked(api);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const userFixture = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@stocka.mx',
  username: 'testuser',
  createdAt: '2026-01-15T00:00:00Z',
};

const signUpResponse = {
  data: {
    user: userFixture,
    accessToken: 'access-token-123',
    emailSent: true,
  },
  success: true,
};

const signInResponse = {
  data: {
    user: { ...userFixture, givenName: null, familyName: null, avatarUrl: null },
    accessToken: 'access-token-456',
    emailVerificationRequired: false,
    onboardingStatus: 'COMPLETED' as const,
  },
  success: true,
};

const refreshResponse = {
  data: { accessToken: 'new-access-token' },
  success: true,
};

const getMeResponse = {
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@stocka.mx',
    username: 'testuser',
    status: 'active' as const,
    givenName: null,
    familyName: null,
    avatarUrl: null,
    createdAt: userFixture.createdAt,
  },
  success: true,
};

const verifyEmailResponse = {
  data: { success: true, message: 'Email verified' },
  success: true,
};

const resendCodeResponse = {
  data: {
    success: true,
    message: 'Code resent',
    cooldownSeconds: 60,
    remainingResends: 4,
  },
  success: true,
};

const forgotPasswordResponse = {
  data: { message: 'If the email exists, a reset link was sent' },
  success: true,
};

const resetPasswordResponse = {
  data: { message: 'Password reset successfully' },
  success: true,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('authenticationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── signUp ───────────────────────────────────────────────────────────────

  describe('signUp', () => {
    it('calls POST /authentication/sign-up with credentials and returns Zod-parsed response', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: signUpResponse });

      const credentials = { email: 'test@stocka.mx', username: 'testuser', password: 'Str0ngPass' };
      const result = await authenticationService.signUp(credentials);

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/sign-up', credentials);
      expect(result).toEqual(signUpResponse);
    });

    it('propagates network errors to the caller', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authenticationService.signUp({ email: 'a@b.com', username: 'u', password: 'p' }),
      ).rejects.toThrow('Network error');
    });
  });

  // ── signIn ───────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('calls POST /authentication/sign-in with credentials and returns Zod-parsed response', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: signInResponse });

      const credentials = { emailOrUsername: 'testuser', password: 'Str0ngPass' };
      const result = await authenticationService.signIn(credentials);

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/sign-in', credentials);
      expect(result).toEqual(signInResponse);
    });

    it('propagates network errors to the caller', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authenticationService.signIn({ emailOrUsername: 'u', password: 'p' }),
      ).rejects.toThrow('Network error');
    });
  });

  // ── signOut ──────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('calls POST /authentication/sign-out with no body', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      await authenticationService.signOut();

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/sign-out');
    });

    it('propagates errors to the caller', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Server error'));

      await expect(authenticationService.signOut()).rejects.toThrow('Server error');
    });
  });

  // ── refreshSession ───────────────────────────────────────────────────────

  describe('refreshSession', () => {
    it('calls POST /authentication/refresh-session and returns Zod-parsed response', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: refreshResponse });

      const result = await authenticationService.refreshSession();

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/refresh-session');
      expect(result).toEqual(refreshResponse);
    });
  });

  // ── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('calls GET /users/me and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: getMeResponse });

      const result = await authenticationService.getMe();

      expect(mockedApi.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(getMeResponse);
    });
  });

  // ── verifyEmail ──────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('calls POST /authentication/verify-email with email and code', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: verifyEmailResponse });

      const payload = { email: 'test@stocka.mx', code: '123456' };
      const result = await authenticationService.verifyEmail(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/verify-email', payload);
      expect(result).toEqual(verifyEmailResponse);
    });
  });

  // ── resendVerificationCode ───────────────────────────────────────────────

  describe('resendVerificationCode', () => {
    it('calls POST /authentication/resend-verification-code with email', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: resendCodeResponse });

      const payload = { email: 'test@stocka.mx' };
      const result = await authenticationService.resendVerificationCode(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/resend-verification-code', payload);
      expect(result).toEqual(resendCodeResponse);
    });
  });

  // ── forgotPassword ───────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('calls POST /authentication/forgot-password with { email }', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: forgotPasswordResponse });

      const result = await authenticationService.forgotPassword('test@stocka.mx');

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/forgot-password', { email: 'test@stocka.mx' });
      expect(result).toEqual(forgotPasswordResponse);
    });
  });

  // ── resetPassword ────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('calls POST /authentication/reset-password with token and newPassword', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: resetPasswordResponse });

      const result = await authenticationService.resetPassword('tok-abc', 'NewP@ss123');

      expect(mockedApi.post).toHaveBeenCalledWith('/authentication/reset-password', {
        token: 'tok-abc',
        newPassword: 'NewP@ss123',
      });
      expect(result).toEqual(resetPasswordResponse);
    });
  });

  // ── getOAuthUrl ──────────────────────────────────────────────────────────

  describe('getOAuthUrl', () => {
    it('returns the full OAuth URL for a given provider', () => {
      const url = authenticationService.getOAuthUrl('google');

      expect(url).toBe('http://localhost:3000/authentication/google');
    });
  });
});
