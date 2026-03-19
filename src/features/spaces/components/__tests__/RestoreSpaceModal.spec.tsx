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

import { RestoreSpaceModal } from '../RestoreSpaceModal';

const space: Space = {
  id: 'space-003',
  tenantId: 'tenant-001',
  name: 'Old Room',
  type: 'CUSTOM_ROOM',
  status: 'ARCHIVED',
  address: null,
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
};

describe('Given RestoreSpaceModal confirms restoring an archived space', () => {
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
        <RestoreSpaceModal
          open={false}
          space={space}
          canRestore={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When the modal is open and canRestore is true', () => {
    it('Then the restore title is shown', () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByText('restoreModal.title')).toBeInTheDocument();
    });

    it('Then the description with space name is shown', () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByText(/restoreModal.description/)).toBeInTheDocument();
    });

    it('Then the confirm button is shown', () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByText('restoreModal.confirm')).toBeInTheDocument();
    });
  });

  describe('When the user clicks confirm', () => {
    beforeEach(() => {
      onConfirm.mockResolvedValue(undefined);
    });

    it('Then onConfirm is called', async () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      await user.click(screen.getByText('restoreModal.confirm'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('When canRestore is false (would exceed tier limit)', () => {
    it('Then the tier limit warning is shown', () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={false}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert').textContent).toContain('restoreModal.tierLimitWarning');
    });

    it('Then the confirm button is not shown', () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={false}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.queryByText('restoreModal.confirm')).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks cancel', () => {
    it('Then onClose is called', async () => {
      render(
        <RestoreSpaceModal
          open={true}
          space={space}
          canRestore={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
      await user.click(screen.getByText('restoreModal.cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
