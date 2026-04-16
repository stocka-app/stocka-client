import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArchivedStoragesFilter } from '@/features/storages/components/ArchivedStoragesFilter';
import type { StorageStatusSummary } from '@/features/storages/types/storages.types';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const SUMMARY: StorageStatusSummary = { active: 5, frozen: 2, archived: 3 };

describe('ArchivedStoragesFilter', () => {
  describe('Given the component renders with no active filter', () => {
    describe('When the four pills are inspected', () => {
      it('Then each pill carries its label and matching counter', () => {
        render(
          <ArchivedStoragesFilter
            value={null}
            summary={SUMMARY}
            canRestore
            onChange={vi.fn()}
          />,
        );

        const tablist = screen.getByRole('tablist', { name: /Filtrar por estado/i });
        const tabs = within(tablist).getAllByRole('tab');

        expect(tabs).toHaveLength(4);
        expect(tabs[0]).toHaveTextContent(/Todas/);
        expect(tabs[0]).toHaveTextContent(/10/); // 5 + 2 + 3
        expect(tabs[1]).toHaveTextContent(/Activas/);
        expect(tabs[1]).toHaveTextContent(/5/);
        expect(tabs[2]).toHaveTextContent(/Congeladas/);
        expect(tabs[2]).toHaveTextContent(/2/);
        expect(tabs[3]).toHaveTextContent(/Archivadas/);
        expect(tabs[3]).toHaveTextContent(/3/);
      });

      it('Then the "Todas" pill is marked as the selected tab', () => {
        render(
          <ArchivedStoragesFilter
            value={null}
            summary={SUMMARY}
            canRestore
            onChange={vi.fn()}
          />,
        );
        const allTab = screen.getByRole('tab', { name: /Todas/ });
        expect(allTab).toHaveAttribute('aria-selected', 'true');
      });

      it('Then no archived hint is rendered yet', () => {
        render(
          <ArchivedStoragesFilter
            value={null}
            summary={SUMMARY}
            canRestore
            onChange={vi.fn()}
          />,
        );
        expect(screen.queryByText(/menú de cada tarjeta/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the user clicks a pill', () => {
    describe('When the Activas pill is clicked', () => {
      it('Then onChange fires with ACTIVE', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
          <ArchivedStoragesFilter
            value={null}
            summary={SUMMARY}
            canRestore
            onChange={onChange}
          />,
        );
        await user.click(screen.getByRole('tab', { name: /Activas/ }));
        expect(onChange).toHaveBeenCalledWith('ACTIVE');
      });
    });

    describe('When the Todas pill is clicked while ARCHIVED is active', () => {
      it('Then onChange fires with null', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
          <ArchivedStoragesFilter
            value="ARCHIVED"
            summary={SUMMARY}
            canRestore
            onChange={onChange}
          />,
        );
        await user.click(screen.getByRole('tab', { name: /Todas/ }));
        expect(onChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Given ARCHIVED is selected and the user can restore', () => {
    describe('When the component renders', () => {
      it('Then the archived hint is shown', () => {
        render(
          <ArchivedStoragesFilter
            value="ARCHIVED"
            summary={SUMMARY}
            canRestore
            onChange={vi.fn()}
          />,
        );
        expect(screen.getByText(/menú de cada tarjeta/)).toBeInTheDocument();
      });
    });
  });

  describe('Given ARCHIVED is selected but the user cannot restore', () => {
    describe('When the component renders', () => {
      it('Then the archived hint is omitted', () => {
        render(
          <ArchivedStoragesFilter
            value="ARCHIVED"
            summary={SUMMARY}
            canRestore={false}
            onChange={vi.fn()}
          />,
        );
        expect(screen.queryByText(/menú de cada tarjeta/)).not.toBeInTheDocument();
      });
    });
  });
});
