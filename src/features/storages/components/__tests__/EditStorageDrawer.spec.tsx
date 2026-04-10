import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { EditStorageDrawerProps } from '../EditStorageDrawer';
import type { Storage } from '../../types/storages.types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key) }),
}));

vi.mock('@/store/theme.store', () => ({
  useThemeStore: (selector: (s: { theme: string }) => unknown) => selector({ theme: 'light' }),
}));

import { EditStorageDrawer } from '../EditStorageDrawer';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ACTIVE_WAREHOUSE: Storage = {
  uuid: '019012ab-0000-7000-8000-000000000001',
  name: 'Main Warehouse',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Calle Falsa 123',
  roomType: null,
  icon: 'warehouse',
  color: '#3B82F6',
  description: 'Primary warehouse',
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ACTIVE_CUSTOM_ROOM: Storage = {
  uuid: '019012ab-0000-7000-8000-000000000002',
  name: 'Custom Office',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: 'Av. Reforma 500',
  roomType: 'General',
  icon: 'restaurant',
  color: '#EC4899',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const FROZEN_STORE_ROOM: Storage = {
  uuid: '019012ab-0000-7000-8000-000000000003',
  name: 'Cold Storage',
  type: 'STORE_ROOM',
  status: 'FROZEN',
  address: 'Bodega Norte',
  roomType: null,
  icon: 'inventory_2',
  color: '#D97706',
  description: 'Frozen store room',
  archivedAt: null,
  frozenAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const DEFAULT_LIMITS: EditStorageDrawerProps['limits'] = {
  WAREHOUSE: 3,
  STORE_ROOM: 3,
  CUSTOM_ROOM: 3,
};

const DEFAULT_TYPE_COUNTS: EditStorageDrawerProps['typeCounts'] = {
  WAREHOUSE: 1,
  STORE_ROOM: 1,
  CUSTOM_ROOM: 1,
};

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('Given the EditStorageDrawer opens with an active warehouse', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onClose: Mock;
  let onEdit: Mock;
  let onChangeType: Mock;

  beforeEach(() => {
    user = userEvent.setup();
    onClose = vi.fn();
    onEdit = vi.fn().mockResolvedValue({ error: null });
    onChangeType = vi.fn().mockResolvedValue({ error: null });
  });

  function renderDrawer(overrides: Partial<EditStorageDrawerProps> = {}): void {
    render(
      <EditStorageDrawer
        open={true}
        storage={ACTIVE_WAREHOUSE}
        onClose={onClose}
        onEdit={onEdit}
        onChangeType={onChangeType}
        limits={DEFAULT_LIMITS}
        typeCounts={DEFAULT_TYPE_COUNTS}
        tier="STARTER"
        {...overrides}
      />,
    );
  }

  // ── Pre-loaded values ───────────────────────────────────────────────────────

  describe('When the drawer renders', () => {
    beforeEach(() => {
      renderDrawer();
    });

    it('Then the edit title is displayed', () => {
      expect(screen.getByText('editDrawer.title')).toBeInTheDocument();
    });

    it('Then the name field shows the storage name', () => {
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      expect(nameInput).toHaveValue('Main Warehouse');
    });

    it('Then the address field shows the storage address', () => {
      const addressInput = screen.getByRole('textbox', { name: /createDrawer\.addressLabel/i });
      expect(addressInput).toHaveValue('Calle Falsa 123');
    });

    it('Then the description field shows the storage description', () => {
      const descInput = screen.getByRole('textbox', { name: /createDrawer\.descriptionLabel/i });
      expect(descInput).toHaveValue('Primary warehouse');
    });

    it('Then the save button is disabled because no changes have been made', () => {
      const saveBtn = screen.getByRole('button', { name: 'editDrawer.submit' });
      expect(saveBtn).toBeDisabled();
    });

    it('Then the type selector is visible with three type options', () => {
      const buttons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('createDrawer.warehouseLabel') ||
                 btn.textContent?.includes('createDrawer.storeRoomLabel') ||
                 btn.textContent?.includes('createDrawer.customRoomLabel'),
      );
      expect(buttons).toHaveLength(3);
    });
  });

  // ── Dirty detection ─────────────────────────────────────────────────────────

  describe('When the user changes the name', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Warehouse');
    });

    it('Then the save button becomes enabled', () => {
      const saveBtn = screen.getByRole('button', { name: 'editDrawer.submit' });
      expect(saveBtn).toBeEnabled();
    });
  });

  describe('When the user changes the name and then reverts it to the original', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Temporary Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Main Warehouse');
    });

    it('Then the save button is disabled again', () => {
      const saveBtn = screen.getByRole('button', { name: 'editDrawer.submit' });
      expect(saveBtn).toBeDisabled();
    });
  });

  // ── Client-side validation: name too short ──────────────────────────────────

  describe('When the user types a name shorter than 3 characters', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Ab');
    });

    it('Then an inline error about minimum length appears', () => {
      expect(screen.getByRole('alert')).toHaveTextContent('editDrawer.errors.nameTooShort');
    });

    it('Then the save button is disabled', () => {
      const saveBtn = screen.getByRole('button', { name: 'editDrawer.submit' });
      expect(saveBtn).toBeDisabled();
    });
  });

  // ── Client-side validation: address required for warehouse ──────────────────

  describe('When the user clears the address on a warehouse', () => {
    beforeEach(async () => {
      renderDrawer();
      const addressInput = screen.getByRole('textbox', { name: /createDrawer\.addressLabel/i });
      await user.clear(addressInput);
    });

    it('Then an inline error about required address appears', () => {
      expect(screen.getByRole('alert')).toHaveTextContent('editDrawer.errors.addressRequired');
    });

    it('Then the save button is disabled', () => {
      const saveBtn = screen.getByRole('button', { name: 'editDrawer.submit' });
      expect(saveBtn).toBeDisabled();
    });
  });

  // ── Server error: duplicate name ────────────────────────────────────────────

  describe('When the user submits and the server returns a duplicate name error', () => {
    beforeEach(async () => {
      onEdit.mockResolvedValue({ error: 'name_taken' });
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Duplicate Name');
      await user.click(screen.getByRole('button', { name: 'editDrawer.submit' }));
    });

    it('Then the duplicate name error appears inline', () => {
      const alerts = screen.getAllByRole('alert');
      const duplicateAlert = alerts.find((el) => el.textContent?.includes('editDrawer.errors.nameDuplicate'));
      expect(duplicateAlert).toBeTruthy();
    });

    it('Then the drawer remains open', () => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── Server error: generic error ─────────────────────────────────────────────

  describe('When the user submits and the server returns a generic error', () => {
    beforeEach(async () => {
      onEdit.mockResolvedValue({ error: 'server_error' });
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'New Valid Name');
      await user.click(screen.getByRole('button', { name: 'editDrawer.submit' }));
    });

    it('Then the error banner is visible with the error message', () => {
      expect(screen.getByText('editDrawer.toast.error')).toBeInTheDocument();
    });

    it('Then the form values are preserved for retry', () => {
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      expect(nameInput).toHaveValue('New Valid Name');
    });

    it('Then the drawer remains open', () => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── Successful edit submission ──────────────────────────────────────────────

  describe('When the user edits the name and submits successfully', () => {
    beforeEach(async () => {
      onEdit.mockResolvedValue({ error: null });
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Renamed Warehouse');
      await user.click(screen.getByRole('button', { name: 'editDrawer.submit' }));
    });

    it('Then onEdit is called with the storage id, type, and changed fields', () => {
      expect(onEdit).toHaveBeenCalledWith(
        ACTIVE_WAREHOUSE.uuid,
        'WAREHOUSE',
        expect.objectContaining({ name: 'Renamed Warehouse' }),
      );
    });

    it('Then onClose is called to dismiss the drawer', () => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── Unsaved changes dialog ──────────────────────────────────────────────────

  describe('When the user has unsaved changes and clicks the close button', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Unsaved Change');
      // Click the X close button (first of the two cancel-labeled buttons)
      const cancelButtons = screen.getAllByRole('button', { name: 'editDrawer.cancel' });
      await user.click(cancelButtons[0]);
    });

    it('Then the unsaved changes dialog appears', () => {
      const dialogs = screen.getAllByRole('dialog');
      const unsavedDialog = dialogs.find(
        (d) => within(d).queryByText('editDrawer.unsaved.title') !== null,
      );
      expect(unsavedDialog).toBeTruthy();
    });

    it('Then onClose is not called yet', () => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('When the unsaved dialog is visible and the user clicks "Keep editing"', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Unsaved Change');
      const cancelButtons = screen.getAllByRole('button', { name: 'editDrawer.cancel' });
      await user.click(cancelButtons[0]);
      // Now the dialog is open — click keep editing
      await user.click(screen.getByRole('button', { name: 'editDrawer.unsaved.keep' }));
    });

    it('Then the dialog closes and the drawer remains open with the edited value', () => {
      const dialogs = screen.queryAllByRole('dialog');
      const unsavedDialog = dialogs.find(
        (d) => within(d).queryByText('editDrawer.unsaved.title') !== null,
      );
      expect(unsavedDialog).toBeUndefined();
      expect(onClose).not.toHaveBeenCalled();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      expect(nameInput).toHaveValue('Unsaved Change');
    });
  });

  describe('When the unsaved dialog is visible and the user clicks "Discard"', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Unsaved Change');
      const cancelButtons = screen.getAllByRole('button', { name: 'editDrawer.cancel' });
      await user.click(cancelButtons[0]);
      // Now the dialog is open — click discard
      await user.click(screen.getByRole('button', { name: 'editDrawer.unsaved.leave' }));
    });

    it('Then onClose is called to dismiss the drawer', () => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('When the user has NO unsaved changes and clicks close', () => {
    beforeEach(async () => {
      renderDrawer();
      // Click the Cancel footer button without making changes
      const cancelButtons = screen.getAllByRole('button', { name: 'editDrawer.cancel' });
      await user.click(cancelButtons[0]);
    });

    it('Then onClose is called directly without showing the dialog', () => {
      expect(onClose).toHaveBeenCalled();
      const dialogs = screen.queryAllByRole('dialog');
      const unsavedDialog = dialogs.find(
        (d) => within(d).queryByText('editDrawer.unsaved.title') !== null,
      );
      expect(unsavedDialog).toBeUndefined();
    });
  });

  // ── Type change: tier limit ─────────────────────────────────────────────────

  describe('When a type is at its tier limit', () => {
    beforeEach(() => {
      renderDrawer({
        typeCounts: { WAREHOUSE: 1, STORE_ROOM: 3, CUSTOM_ROOM: 1 },
      });
    });

    it('Then the type button at limit is visually disabled', () => {
      const buttons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('createDrawer.storeRoomLabel'),
      );
      expect(buttons[0]).toBeDisabled();
    });
  });

  describe('When a type change is attempted and the server returns a tier limit error', () => {
    beforeEach(async () => {
      onChangeType.mockResolvedValue({ error: 'tier_limit' });
      renderDrawer();
      // Click the CUSTOM_ROOM type button (not current type, which is WAREHOUSE)
      const buttons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('createDrawer.customRoomLabel'),
      );
      await user.click(buttons[0]);
    });

    it('Then the tier limit warning message appears', () => {
      expect(screen.getByText(/editDrawer\.warnings\.tierLimit/)).toBeInTheDocument();
    });

    it('Then the "See plans" link is visible', () => {
      expect(screen.getByText('editDrawer.warnings.seePlans')).toBeInTheDocument();
    });
  });

  // ── Null storage shows spinner ──────────────────────────────────────────────

  describe('When the drawer opens without a storage (null)', () => {
    it('Then a loading spinner is shown instead of the form', () => {
      renderDrawer({ storage: null });
      // No form fields visible
      expect(screen.queryByRole('textbox', { name: /createDrawer\.nameLabel/i })).toBeNull();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Frozen storage
// ═════════════════════════════════════════════════════════════════════════════

describe('Given the EditStorageDrawer opens with a frozen storage', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onClose: Mock;
  let onEdit: Mock;
  let onChangeType: Mock;

  beforeEach(() => {
    user = userEvent.setup();
    onClose = vi.fn();
    onEdit = vi.fn().mockResolvedValue({ error: null });
    onChangeType = vi.fn().mockResolvedValue({ error: null });
  });

  function renderDrawer(overrides: Partial<EditStorageDrawerProps> = {}): void {
    render(
      <EditStorageDrawer
        open={true}
        storage={FROZEN_STORE_ROOM}
        onClose={onClose}
        onEdit={onEdit}
        onChangeType={onChangeType}
        limits={DEFAULT_LIMITS}
        typeCounts={DEFAULT_TYPE_COUNTS}
        tier="STARTER"
        {...overrides}
      />,
    );
  }

  describe('When the drawer renders', () => {
    beforeEach(() => {
      renderDrawer();
    });

    it('Then the type selector is not visible', () => {
      const typeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('createDrawer.warehouseLabel') ||
                 btn.textContent?.includes('createDrawer.storeRoomLabel') ||
                 btn.textContent?.includes('createDrawer.customRoomLabel'),
      );
      expect(typeButtons).toHaveLength(0);
    });

    it('Then a frozen notice is visible', () => {
      expect(screen.getByText('editDrawer.warnings.iconChange')).toBeInTheDocument();
    });

    it('Then form fields are still editable', () => {
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      expect(nameInput).toHaveValue('Cold Storage');
      expect(nameInput).not.toBeDisabled();
    });
  });

  describe('When the user edits the name and submits', () => {
    beforeEach(async () => {
      renderDrawer();
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Renamed Cold Storage');
      await user.click(screen.getByRole('button', { name: 'editDrawer.submit' }));
    });

    it('Then onEdit is called with the frozen storage id', () => {
      expect(onEdit).toHaveBeenCalledWith(
        FROZEN_STORE_ROOM.uuid,
        'STORE_ROOM',
        expect.objectContaining({ name: 'Renamed Cold Storage' }),
      );
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Custom room — icon/color section
// ═════════════════════════════════════════════════════════════════════════════

describe('Given the EditStorageDrawer opens with a custom room', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onClose: Mock;
  let onEdit: Mock;
  let onChangeType: Mock;

  beforeEach(() => {
    user = userEvent.setup();
    onClose = vi.fn();
    onEdit = vi.fn().mockResolvedValue({ error: null });
    onChangeType = vi.fn().mockResolvedValue({ error: null });
  });

  function renderDrawer(overrides: Partial<EditStorageDrawerProps> = {}): void {
    render(
      <EditStorageDrawer
        open={true}
        storage={ACTIVE_CUSTOM_ROOM}
        onClose={onClose}
        onEdit={onEdit}
        onChangeType={onChangeType}
        limits={DEFAULT_LIMITS}
        typeCounts={DEFAULT_TYPE_COUNTS}
        tier="STARTER"
        {...overrides}
      />,
    );
  }

  describe('When the drawer renders', () => {
    beforeEach(() => {
      renderDrawer();
    });

    it('Then the icon/color picker trigger is visible', () => {
      // The custom room shows a clickable button to open the picker — it contains
      // the icon name and chevron_right indicator. Multiple "restaurant" texts
      // exist (banner + picker), so assert at least one is present.
      expect(screen.getAllByText('restaurant').length).toBeGreaterThanOrEqual(1);
    });

    it('Then the form shows the custom room name', () => {
      const nameInput = screen.getByRole('textbox', { name: /createDrawer\.nameLabel/i });
      expect(nameInput).toHaveValue('Custom Office');
    });
  });

  describe('When the user edits description only and submits', () => {
    beforeEach(async () => {
      renderDrawer();
      const descInput = screen.getByRole('textbox', { name: /createDrawer\.descriptionLabel/i });
      await user.type(descInput, 'A nice custom room');
      await user.click(screen.getByRole('button', { name: 'editDrawer.submit' }));
    });

    it('Then onEdit payload includes only the description change', () => {
      expect(onEdit).toHaveBeenCalledWith(
        ACTIVE_CUSTOM_ROOM.uuid,
        'CUSTOM_ROOM',
        { description: 'A nice custom room' },
      );
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Type change: frozen error
// ═════════════════════════════════════════════════════════════════════════════

describe('Given the EditStorageDrawer opens with an active storage and a type change returns frozen error', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('Then the frozen error warning is displayed', async () => {
    const onChangeType = vi.fn().mockResolvedValue({ error: 'frozen' });
    render(
      <EditStorageDrawer
        open={true}
        storage={ACTIVE_WAREHOUSE}
        onClose={vi.fn()}
        onEdit={vi.fn().mockResolvedValue({ error: null })}
        onChangeType={onChangeType}
        limits={DEFAULT_LIMITS}
        typeCounts={DEFAULT_TYPE_COUNTS}
        tier="STARTER"
      />,
    );

    // Click a different type
    const buttons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('createDrawer.storeRoomLabel'),
    );
    await user.click(buttons[0]);

    expect(screen.getByText('editDrawer.warnings.iconChange')).toBeInTheDocument();
  });
});
