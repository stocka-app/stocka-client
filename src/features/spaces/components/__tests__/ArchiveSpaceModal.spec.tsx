import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Space } from '../../types/spaces.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts) return `${key}:${JSON.stringify(opts)}`;
      return key;
    },
  }),
}));

import { ArchiveSpaceModal } from '../ArchiveSpaceModal';

const space: Space = {
  id: 'space-001',
  tenantId: 'tenant-001',
  name: 'Main Store Room',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Given ArchiveSpaceModal confirms the archiving of a space', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onConfirm.mockClear();
    user = userEvent.setup();
  });

  describe('When the modal is closed', () => {
    it('Then nothing is rendered', () => {
      const { container } = render(
        <ArchiveSpaceModal
          open={false}
          space={space}
          canArchive={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When the modal is open and canArchive is true', () => {
    it('Then the archive title is shown', () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByText('archiveModal.title')).toBeInTheDocument();
    });

    it('Then the description with space name is shown', () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByText(/archiveModal.description/)).toBeInTheDocument();
    });

    it('Then the confirm button is shown', () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByText('archiveModal.confirm')).toBeInTheDocument();
    });
  });

  describe('When the user clicks confirm', () => {
    beforeEach(() => {
      onConfirm.mockResolvedValue(undefined);
    });

    it('Then onConfirm is called', async () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      await user.click(screen.getByText('archiveModal.confirm'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('When canArchive is false (last active space of its type)', () => {
    it('Then the blocking warning is shown', () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={false}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert').textContent).toContain('archiveModal.lastActiveWarning');
    });

    it('Then the confirm button is not shown', () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={false}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.queryByText('archiveModal.confirm')).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks cancel', () => {
    it('Then onClose is called', async () => {
      render(
        <ArchiveSpaceModal
          open={true}
          space={space}
          canArchive={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      await user.click(screen.getByText('archiveModal.cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
