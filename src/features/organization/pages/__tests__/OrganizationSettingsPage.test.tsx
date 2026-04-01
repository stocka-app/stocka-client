import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizationSettingsPage from '../OrganizationSettingsPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const { mockPermission } = vi.hoisted(() => ({
  mockPermission: { value: true },
}));

vi.mock('@/features/team', () => ({
  usePermission: () => mockPermission.value,
}));

const mockFetchProfile = vi.fn();
const mockFetchAuditLog = vi.fn();

const mocks = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  auditLog: [] as unknown[],
  isLoading: false,
  error: null as string | null,
}));

vi.mock('../../hooks/useOrganization', () => ({
  useOrganization: () => ({
    profile: mocks.profile,
    auditLog: mocks.auditLog,
    isLoading: mocks.isLoading,
    error: mocks.error,
    fetchProfile: mockFetchProfile,
    fetchAuditLog: mockFetchAuditLog,
  }),
}));

/** Stub child components */
vi.mock('../../components/TenantStatusBanner', () => ({
  TenantStatusBanner: ({ status }: { status: string }) => (
    <div data-testid="status-banner">{status}</div>
  ),
}));

let profileCardProps: Record<string, unknown> = {};
vi.mock('../../components/OrgProfileCard', () => ({
  OrgProfileCard: (props: Record<string, unknown>) => {
    profileCardProps = props;
    return <div data-testid="profile-card">ProfileCard</div>;
  },
}));

let editFormProps: Record<string, unknown> = {};
vi.mock('../../components/OrgEditForm', () => ({
  OrgEditForm: (props: Record<string, unknown>) => {
    editFormProps = props;
    return <div data-testid="edit-form">EditForm</div>;
  },
}));

vi.mock('../../components/TierQuotasSection', () => ({
  TierQuotasSection: () => <div data-testid="tier-quotas">TierQuotas</div>,
}));

vi.mock('../../components/AuditLogTable', () => ({
  AuditLogTable: () => <div data-testid="audit-log">AuditLog</div>,
}));

vi.mock('../../components/DangerZoneSection', () => ({
  DangerZoneSection: () => <div data-testid="danger-zone">DangerZone</div>,
}));

describe('OrganizationSettingsPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockPermission.value = true;
    profileCardProps = {};
    editFormProps = {};
    mocks.profile = {
      id: 'tenant-1',
      name: 'Mi Negocio',
      status: 'ACTIVE',
    };
    mocks.auditLog = [];
    mocks.isLoading = false;
    mocks.error = null;
  });

  // ── Initial render ────────────────────────────────────────────────

  describe('Given the page loads with a profile', () => {
    beforeEach(() => {
      render(<OrganizationSettingsPage />);
    });

    it('Then fetchProfile is called on mount', () => {
      expect(mockFetchProfile).toHaveBeenCalledOnce();
    });

    it('Then the page title is shown', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('pageTitle');
    });

    it('Then 3 tabs are shown', () => {
      expect(screen.getByText('tabs.profile')).toBeInTheDocument();
      expect(screen.getByText('tabs.limits')).toBeInTheDocument();
      expect(screen.getByText('tabs.audit')).toBeInTheDocument();
    });

    it('Then the profile card is shown by default', () => {
      expect(screen.getByTestId('profile-card')).toBeInTheDocument();
    });

    it('Then the danger zone is shown on the profile tab', () => {
      expect(screen.getByTestId('danger-zone')).toBeInTheDocument();
    });
  });

  // ── Tab navigation ────────────────────────────────────────────────

  describe('Given the user clicks the limits tab', () => {
    beforeEach(async () => {
      render(<OrganizationSettingsPage />);
      await user.click(screen.getByText('tabs.limits'));
    });

    it('Then the tier quotas section is shown', () => {
      expect(screen.getByTestId('tier-quotas')).toBeInTheDocument();
    });

    it('Then the profile card is not shown', () => {
      expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument();
    });
  });

  describe('Given the user clicks the audit tab', () => {
    beforeEach(async () => {
      render(<OrganizationSettingsPage />);
      await user.click(screen.getByText('tabs.audit'));
    });

    it('Then the audit log table is shown', () => {
      expect(screen.getByTestId('audit-log')).toBeInTheDocument();
    });

    it('Then fetchAuditLog is called', () => {
      expect(mockFetchAuditLog).toHaveBeenCalledOnce();
    });
  });

  // ── Loading state ─────────────────────────────────────────────────

  describe('Given the page is loading', () => {
    beforeEach(() => {
      mocks.isLoading = true;
      mocks.profile = null;
      render(<OrganizationSettingsPage />);
    });

    it('Then loading text is shown', () => {
      expect(screen.getByText('audit.loading')).toBeInTheDocument();
    });
  });

  // ── Error state ──────────────────────────────────────────────────

  describe('Given there is an error', () => {
    beforeEach(() => {
      mocks.error = 'errors.fetchFailed';
      mocks.profile = null;
      render(<OrganizationSettingsPage />);
    });

    it('Then the error message is shown', () => {
      expect(screen.getByText('errors.fetchFailed')).toBeInTheDocument();
    });
  });

  // ── Non-active status banner ──────────────────────────────────────

  describe('Given the profile has a non-active status', () => {
    beforeEach(() => {
      mocks.profile = { ...mocks.profile, status: 'SUSPENDED' };
      render(<OrganizationSettingsPage />);
    });

    it('Then the status banner is shown', () => {
      expect(screen.getByTestId('status-banner')).toHaveTextContent('SUSPENDED');
    });
  });

  // ── Edit mode ─────────────────────────────────────────────────────

  describe('Given the user clicks the edit button on the profile card', () => {
    beforeEach(async () => {
      render(<OrganizationSettingsPage />);
      // Trigger onEdit from the profile card stub
      await act(async () => {
        (profileCardProps.onEdit as () => void)();
      });
    });

    it('Then the edit form is shown instead of the profile card', () => {
      expect(screen.getByTestId('edit-form')).toBeInTheDocument();
      expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument();
    });

    describe('When the user cancels editing', () => {
      beforeEach(async () => {
        await act(async () => {
          (editFormProps.onCancel as () => void)();
        });
      });

      it('Then the profile card is shown again', () => {
        expect(screen.getByTestId('profile-card')).toBeInTheDocument();
        expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
      });
    });

    describe('When the user saves the form', () => {
      beforeEach(async () => {
        await act(async () => {
          (editFormProps.onSaved as () => void)();
        });
      });

      it('Then the profile card is shown again', () => {
        expect(screen.getByTestId('profile-card')).toBeInTheDocument();
        expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
      });
    });
  });

  // ── Audit tab: fetchAuditLog called only once ─────────────────────

  describe('Given the user clicks the audit tab twice', () => {
    beforeEach(async () => {
      render(<OrganizationSettingsPage />);
      await user.click(screen.getByText('tabs.audit'));
      await user.click(screen.getByText('tabs.audit'));
    });

    it('Then fetchAuditLog is called only once', () => {
      expect(mockFetchAuditLog).toHaveBeenCalledTimes(1);
    });
  });

  // ── Audit tab: no permission ──────────────────────────────────────

  describe('Given the user does not have permission to view the audit log', () => {
    beforeEach(async () => {
      mockPermission.value = false;
      render(<OrganizationSettingsPage />);
      await user.click(screen.getByText('tabs.audit'));
    });

    it('Then the no permission message is shown', () => {
      expect(screen.getByText('audit.noPermission')).toBeInTheDocument();
    });

    it('Then the audit log table is not shown', () => {
      expect(screen.queryByTestId('audit-log')).not.toBeInTheDocument();
    });
  });
});
