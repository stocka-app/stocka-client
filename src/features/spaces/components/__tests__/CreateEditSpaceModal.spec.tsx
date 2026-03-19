import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Space } from '../../types/spaces.types';

const mockOpenUpgradeModal = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/shared/hooks/useTierGate', () => ({
  useTierGate: () => ({
    openUpgradeModal: mockOpenUpgradeModal,
    closeUpgradeModal: vi.fn(),
    isOpen: false,
  }),
}));

let currentTier: string | null = 'FREE';

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({ tier: currentTier }),
}));

import { CreateEditSpaceModal } from '../CreateEditSpaceModal';

describe('Given CreateEditSpaceModal handles space creation and editing', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    currentTier = 'FREE';
    onClose.mockClear();
    onSave.mockClear();
    mockOpenUpgradeModal.mockClear();
    user = userEvent.setup();
  });

  describe('When the modal is closed', () => {
    it('Then nothing is rendered', () => {
      const { container } = render(
        <CreateEditSpaceModal open={false} onClose={onClose} onSave={onSave} />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When the modal is open in create mode', () => {
    it('Then the create title is shown', () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      expect(screen.getByText('createModal.titleCreate')).toBeInTheDocument();
    });

    it('Then the name field is empty', () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      const nameInput = screen.getByRole('textbox', { name: /createModal.name/i });
      expect(nameInput).toHaveValue('');
    });

    it('Then the cancel button calls onClose', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      await user.click(screen.getByText('createModal.cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('When the modal is open in edit mode', () => {
    const editSpace: Space = {
      id: 'space-001',
      tenantId: 'tenant-001',
      name: 'Existing Space',
      type: 'STORE_ROOM',
      status: 'ACTIVE',
      address: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('Then the edit title is shown', () => {
      render(
        <CreateEditSpaceModal open={true} space={editSpace} onClose={onClose} onSave={onSave} />,
      );
      expect(screen.getByText('createModal.titleEdit')).toBeInTheDocument();
    });

    it('Then the name field is pre-filled with the space name', () => {
      render(
        <CreateEditSpaceModal open={true} space={editSpace} onClose={onClose} onSave={onSave} />,
      );
      const nameInput = screen.getByRole('textbox', { name: /createModal.name/i });
      expect(nameInput).toHaveValue('Existing Space');
    });
  });

  describe('When the user submits a valid CUSTOM_ROOM', () => {
    beforeEach(() => {
      onSave.mockResolvedValue(true);
    });

    it('Then onSave is called with the form data', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      await user.clear(screen.getByRole('textbox', { name: /createModal.name/i }));
      await user.type(screen.getByRole('textbox', { name: /createModal.name/i }), 'New Room');
      await user.click(screen.getByText('createModal.save'));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('When the user submits with an empty name', () => {
    it('Then an error message is shown and onSave is not called', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      await user.click(screen.getByText('createModal.save'));
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('When tier is FREE and WAREHOUSE is selected', () => {
    it('Then the WAREHOUSE option shows a disabled hint', () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      const warehouseOption = screen.getByRole('option', { name: /WAREHOUSE/i });
      expect(warehouseOption).toBeDisabled();
    });

    it('Then the upgrade hint link is visible', () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      expect(screen.getByText('createModal.warehouseDisabled')).toBeInTheDocument();
    });

    it('Then clicking the upgrade hint opens the UpgradeModal', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      await user.click(screen.getByText('createModal.warehouseDisabled'));
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });
  });

  describe('When tier is STARTER and WAREHOUSE is selected', () => {
    beforeEach(() => {
      currentTier = 'STARTER';
    });

    it('Then the WAREHOUSE option is enabled', () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      const warehouseOption = screen.getByRole('option', { name: /^types\.WAREHOUSE$/ });
      expect(warehouseOption).not.toBeDisabled();
    });

    it('Then the address required hint is shown when WAREHOUSE is selected', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      const select = screen.getByLabelText('createModal.type');
      fireEvent.change(select, { target: { value: 'WAREHOUSE' } });
      await waitFor(() => {
        expect(screen.getByText('(createModal.addressRequired)')).toBeInTheDocument();
      });
    });

    it('Then submitting WAREHOUSE without address shows the address error', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      const select = screen.getByLabelText('createModal.type');
      fireEvent.change(select, { target: { value: 'WAREHOUSE' } });
      await user.type(screen.getByRole('textbox', { name: /createModal.name/i }), 'New Warehouse');
      await user.click(screen.getByText('createModal.save'));
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('When the form has an invalid type value', () => {
    const invalidSpace = {
      id: 'space-bad',
      tenantId: 'tenant-001',
      name: 'Bad Space',
      type: 'INVALID_TYPE' as Space['type'],
      status: 'ACTIVE' as const,
      address: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
      currentTier = 'STARTER';
    });

    it('Then submitting shows a type error and onSave is not called', async () => {
      render(
        <CreateEditSpaceModal
          open={true}
          space={invalidSpace}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      await user.click(screen.getByText('createModal.save'));
      await waitFor(() => {
        expect(screen.getByText(/Invalid option/i)).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('When onSave returns false', () => {
    beforeEach(() => {
      onSave.mockResolvedValue(false);
    });

    it('Then the modal remains open and onClose is not called', async () => {
      render(<CreateEditSpaceModal open={true} onClose={onClose} onSave={onSave} />);
      await user.type(screen.getByRole('textbox', { name: /createModal.name/i }), 'New Room');
      await user.click(screen.getByText('createModal.save'));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
