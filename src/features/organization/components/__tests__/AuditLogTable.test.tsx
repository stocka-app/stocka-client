import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditLogTable } from '@/features/organization/components/AuditLogTable';
import type { AuditLogEntry } from '@/features/organization/types/organization.types';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const buildEntry = (index: number): AuditLogEntry => ({
  id: `audit-${index.toString().padStart(3, '0')}`,
  timestamp: '2026-03-01T10:00:00.000Z',
  actorId: 'user-001',
  actorName: `Actor ${index}`,
  action: 'PROFILE_UPDATED',
  details: `Details for entry ${index}`,
});

describe('AuditLogTable', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // =========================================================================
  // Loading state
  // =========================================================================

  describe('Given the audit log is being loaded', () => {
    describe('When the component renders', () => {
      it('Then a loading indicator is shown', () => {
        render(<AuditLogTable entries={[]} isLoading={true} error={null} />);
        expect(screen.getByText('audit.loading')).toBeInTheDocument();
      });

      it('Then the table is not rendered', () => {
        render(<AuditLogTable entries={[]} isLoading={true} error={null} />);
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Error state
  // =========================================================================

  describe('Given the audit log fetch failed', () => {
    describe('When the component renders', () => {
      it('Then the error message is shown', () => {
        render(<AuditLogTable entries={[]} isLoading={false} error="errors.fetchAuditFailed" />);
        expect(screen.getByText('errors.fetchAuditFailed')).toBeInTheDocument();
      });

      it('Then the table is not rendered', () => {
        render(<AuditLogTable entries={[]} isLoading={false} error="errors.fetchAuditFailed" />);
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Empty state
  // =========================================================================

  describe('Given the audit log is empty', () => {
    describe('When the component renders', () => {
      it('Then the empty state message is shown', () => {
        render(<AuditLogTable entries={[]} isLoading={false} error={null} />);
        expect(screen.getByText('audit.empty')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Table with entries
  // =========================================================================

  describe('Given the audit log has entries', () => {
    describe('When the component renders with fewer than 20 entries', () => {
      it('Then all entries are visible', () => {
        const entries = [buildEntry(1), buildEntry(2), buildEntry(3)];
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);

        expect(screen.getByText('Actor 1')).toBeInTheDocument();
        expect(screen.getByText('Actor 2')).toBeInTheDocument();
        expect(screen.getByText('Actor 3')).toBeInTheDocument();
      });

      it('Then the Load More button is not shown', () => {
        const entries = [buildEntry(1)];
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);
        expect(screen.queryByRole('button', { name: 'audit.loadMore' })).not.toBeInTheDocument();
      });

      it('Then the table headers are shown', () => {
        const entries = [buildEntry(1)];
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);
        expect(screen.getByText('audit.columns.datetime')).toBeInTheDocument();
        expect(screen.getByText('audit.columns.actor')).toBeInTheDocument();
        expect(screen.getByText('audit.columns.action')).toBeInTheDocument();
        expect(screen.getByText('audit.columns.details')).toBeInTheDocument();
      });

      it('Then entry details are shown', () => {
        const entries = [buildEntry(1)];
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);
        expect(screen.getByText('Details for entry 1')).toBeInTheDocument();
        expect(screen.getByText('PROFILE_UPDATED')).toBeInTheDocument();
      });
    });

    describe('When the component renders with more than 20 entries', () => {
      it('Then only the first 20 entries are visible', () => {
        const entries = Array.from({ length: 25 }, (_, i) => buildEntry(i + 1));
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);

        // First 20 actors should be visible
        expect(screen.getByText('Actor 1')).toBeInTheDocument();
        expect(screen.getByText('Actor 20')).toBeInTheDocument();
        // 21st entry should NOT be visible
        expect(screen.queryByText('Actor 21')).not.toBeInTheDocument();
      });

      it('Then the Load More button is shown', () => {
        const entries = Array.from({ length: 25 }, (_, i) => buildEntry(i + 1));
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);
        expect(screen.getByRole('button', { name: 'audit.loadMore' })).toBeInTheDocument();
      });

      describe('When the user clicks Load More', () => {
        it('Then more entries become visible', async () => {
          const entries = Array.from({ length: 25 }, (_, i) => buildEntry(i + 1));
          render(<AuditLogTable entries={entries} isLoading={false} error={null} />);

          await user.click(screen.getByRole('button', { name: 'audit.loadMore' }));

          expect(screen.getByText('Actor 21')).toBeInTheDocument();
          expect(screen.getByText('Actor 25')).toBeInTheDocument();
        });

        it('Then the Load More button disappears when all entries are shown', async () => {
          const entries = Array.from({ length: 25 }, (_, i) => buildEntry(i + 1));
          render(<AuditLogTable entries={entries} isLoading={false} error={null} />);

          await user.click(screen.getByRole('button', { name: 'audit.loadMore' }));

          expect(screen.queryByRole('button', { name: 'audit.loadMore' })).not.toBeInTheDocument();
        });
      });
    });

    describe('When the component renders with exactly 20 entries', () => {
      it('Then all entries are shown without Load More button', () => {
        const entries = Array.from({ length: 20 }, (_, i) => buildEntry(i + 1));
        render(<AuditLogTable entries={entries} isLoading={false} error={null} />);

        expect(screen.getByText('Actor 20')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'audit.loadMore' })).not.toBeInTheDocument();
      });
    });
  });
});
