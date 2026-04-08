import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateStorageDrawerProps } from '../CreateStorageDrawer';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOpenUpgradeModal = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/shared/hooks/useTierCapabilities', () => ({
  useTierCapabilities: () => ({
    isAllowed: () => true,
    openUpgradeModal: mockOpenUpgradeModal,
  }),
  STORAGE_TYPE_TO_FEATURE: {
    WAREHOUSE: 'warehouses',
    STORE_ROOM: 'storeRooms',
    CUSTOM_ROOM: 'customRooms',
  },
}));

import { CreateStorageDrawer } from '../CreateStorageDrawer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_LIMITS: CreateStorageDrawerProps['limits'] = {
  WAREHOUSE: 3,
  STORE_ROOM: 3,
  CUSTOM_ROOM: 3,
};

const DEFAULT_TYPE_COUNTS: CreateStorageDrawerProps['typeCounts'] = {
  WAREHOUSE: 0,
  STORE_ROOM: 0,
  CUSTOM_ROOM: 0,
};

// ─── Spec ────────────────────────────────────────────────────────────────────

describe('Given the CreateStorageDrawer is open', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onClose: ReturnType<typeof vi.fn>;
  let onCreateWarehouse: ReturnType<typeof vi.fn>;
  let onCreateStoreRoom: ReturnType<typeof vi.fn>;
  let onCreateCustomRoom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    onClose = vi.fn();
    onCreateWarehouse = vi.fn().mockResolvedValue({ error: null });
    onCreateStoreRoom = vi.fn().mockResolvedValue({ error: null });
    onCreateCustomRoom = vi.fn().mockResolvedValue({ error: null });
    mockOpenUpgradeModal.mockClear();
  });

  function renderDrawer(overrides: Partial<CreateStorageDrawerProps> = {}): void {
    render(
      <CreateStorageDrawer
        open={true}
        onClose={onClose}
        typeCounts={DEFAULT_TYPE_COUNTS}
        limits={DEFAULT_LIMITS}
        tier="STARTER"
        onCreateWarehouse={onCreateWarehouse}
        onCreateStoreRoom={onCreateStoreRoom}
        onCreateCustomRoom={onCreateCustomRoom}
        {...overrides}
      />,
    );
  }

  async function navigateToStep2(type: 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM'): Promise<void> {
    await user.click(screen.getByTestId(`type-card-${type}`));
    // step2Title appears only in the visible body, not in the sr-only live region
    await waitFor(() => expect(screen.getByText('createDrawer.step2Title')).toBeInTheDocument(), {
      timeout: 500,
    });
  }

  // ─── Step 1: Type selection ───────────────────────────────────────────────

  describe('When the drawer first renders', () => {
    it('Then all three type cards are visible with step-1 header', () => {
      renderDrawer();
      // step1Title is unique — the sr-only live region only uses step1Label
      expect(screen.getByText('createDrawer.step1Title')).toBeInTheDocument();
      expect(screen.getByTestId('type-card-WAREHOUSE')).toBeInTheDocument();
      expect(screen.getByTestId('type-card-STORE_ROOM')).toBeInTheDocument();
      expect(screen.getByTestId('type-card-CUSTOM_ROOM')).toBeInTheDocument();
    });
  });

  describe('When the user clicks Cancel on step 1 without selecting a type', () => {
    it('Then onClose is called immediately without an abandon dialog', async () => {
      renderDrawer();
      await user.click(screen.getByRole('button', { name: 'createDrawer.pickerCancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('createDrawer.cancelConfirmTitle')).not.toBeInTheDocument();
    });
  });

  describe('When the user selects a type card', () => {
    it('Then the drawer advances to the details step', async () => {
      renderDrawer();
      await navigateToStep2('WAREHOUSE');
      // step2Label appears twice (visible + sr-only), step2Title is unique in the body
      expect(screen.getAllByText('createDrawer.step2Label')).toHaveLength(2);
      expect(screen.getByText('createDrawer.step2Title')).toBeInTheDocument();
    });
  });

  // ─── Step 2: WAREHOUSE ────────────────────────────────────────────────────

  describe('Given the user has selected WAREHOUSE and is on the details step', () => {
    beforeEach(async () => {
      renderDrawer();
      await navigateToStep2('WAREHOUSE');
    });

    describe('When the form loads empty', () => {
      it('Then the Create button is disabled', () => {
        expect(screen.getByRole('button', { name: 'createDrawer.create' })).toBeDisabled();
      });

      it('Then the fixed icon/color display is shown instead of a picker button', () => {
        expect(screen.getByText('createDrawer.fixedIconLabel')).toBeInTheDocument();
        expect(screen.getByText('createDrawer.fixedIconWarehouse')).toBeInTheDocument();
      });

      it('Then the name placeholder is warehouse-specific', () => {
        expect(screen.getByPlaceholderText('createDrawer.namePlaceholderWarehouse')).toBeInTheDocument();
      });

      it('Then the name and address character counters are visible', () => {
        expect(screen.getByText('createDrawer.nameCharsLeft')).toBeInTheDocument();
        expect(screen.getByText('createDrawer.addressCharsLeft')).toBeInTheDocument();
      });
    });

    describe('When the user fills in the name but leaves address empty', () => {
      it('Then the Create button remains disabled', async () => {
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'My Warehouse');
        expect(screen.getByRole('button', { name: 'createDrawer.create' })).toBeDisabled();
      });
    });

    describe('When the user fills in both name and address', () => {
      it('Then the Create button becomes enabled', async () => {
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'My Warehouse');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '123 Main St');
        expect(screen.getByRole('button', { name: 'createDrawer.create' })).not.toBeDisabled();
      });
    });

    describe('When the user submits valid data', () => {
      beforeEach(async () => {
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'My Warehouse');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '123 Main St');
        await user.click(screen.getByRole('button', { name: 'createDrawer.create' }));
      });

      it('Then onCreateWarehouse is called with the correct payload', async () => {
        await waitFor(() => {
          expect(onCreateWarehouse).toHaveBeenCalledWith({
            name: 'My Warehouse',
            address: '123 Main St',
            description: undefined,
          });
        });
      });

      it('Then onClose is called on success', async () => {
        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      });
    });

    describe('When the API returns a duplicate name error', () => {
      beforeEach(async () => {
        onCreateWarehouse.mockResolvedValue({ error: 'name_taken' });
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'Duplicate Name');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '123 Main St');
        await user.click(screen.getByRole('button', { name: 'createDrawer.create' }));
      });

      it('Then an inline error is shown under the name field', async () => {
        await waitFor(() =>
          expect(screen.getByText('createDrawer.nameTakenError')).toBeInTheDocument(),
        );
      });

      it('Then onClose is not called and the form stays open', async () => {
        await waitFor(() => expect(screen.getByText('createDrawer.nameTakenError')).toBeInTheDocument());
        expect(onClose).not.toHaveBeenCalled();
      });
    });

    describe('When the API returns a server error', () => {
      beforeEach(async () => {
        onCreateWarehouse.mockResolvedValue({ error: 'server_error' });
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'My Warehouse');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '123 Main St');
        await user.click(screen.getByRole('button', { name: 'createDrawer.create' }));
      });

      it('Then a server error banner is shown', async () => {
        await waitFor(() =>
          expect(screen.getByText('createDrawer.serverError')).toBeInTheDocument(),
        );
      });

      it('Then onClose is not called and form data is preserved', async () => {
        await waitFor(() => expect(screen.getByText('createDrawer.serverError')).toBeInTheDocument());
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' })).toHaveValue('My Warehouse');
      });
    });

    describe('When the user enters data and clicks the close button', () => {
      beforeEach(async () => {
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'My Warehouse');
      });

      it('Then the abandon confirm dialog appears', async () => {
        await user.click(screen.getByRole('button', { name: 'createDrawer.close' }));
        expect(screen.getByText('createDrawer.cancelConfirmTitle')).toBeInTheDocument();
        expect(screen.getByText('createDrawer.cancelConfirmBody')).toBeInTheDocument();
      });

      describe('When the user clicks Keep Editing', () => {
        it('Then the dialog closes and form data is preserved', async () => {
          await user.click(screen.getByRole('button', { name: 'createDrawer.close' }));
          await user.click(screen.getByRole('button', { name: 'createDrawer.keepEditing' }));
          expect(screen.queryByText('createDrawer.cancelConfirmTitle')).not.toBeInTheDocument();
          expect(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' })).toHaveValue('My Warehouse');
          expect(onClose).not.toHaveBeenCalled();
        });
      });

      describe('When the user clicks Abandon', () => {
        it('Then onClose is called', async () => {
          await user.click(screen.getByRole('button', { name: 'createDrawer.close' }));
          await user.click(screen.getByRole('button', { name: 'createDrawer.abandon' }));
          expect(onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('When the user has not entered data and clicks the close button', () => {
      it('Then onClose is called immediately without the abandon dialog', async () => {
        await user.click(screen.getByRole('button', { name: 'createDrawer.close' }));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('createDrawer.cancelConfirmTitle')).not.toBeInTheDocument();
      });
    });
  });

  // ─── Step 2: STORE_ROOM ───────────────────────────────────────────────────

  describe('Given the user has selected STORE_ROOM', () => {
    describe('When the user submits valid data', () => {
      it('Then onCreateStoreRoom is called with the correct payload', async () => {
        renderDrawer();
        await navigateToStep2('STORE_ROOM');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'Back Store');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '456 Side St');
        await user.click(screen.getByRole('button', { name: 'createDrawer.create' }));
        await waitFor(() =>
          expect(onCreateStoreRoom).toHaveBeenCalledWith({
            name: 'Back Store',
            address: '456 Side St',
            description: undefined,
          }),
        );
      });
    });
  });

  // ─── Step 2: CUSTOM_ROOM ──────────────────────────────────────────────────

  describe('Given the user has selected CUSTOM_ROOM', () => {
    beforeEach(async () => {
      renderDrawer();
      await navigateToStep2('CUSTOM_ROOM');
    });

    describe('When the form loads', () => {
      it('Then the icon/color picker button is shown instead of a fixed display', () => {
        expect(screen.queryByText('createDrawer.fixedIconWarehouse')).not.toBeInTheDocument();
        expect(screen.queryByText('createDrawer.fixedIconStoreRoom')).not.toBeInTheDocument();
        expect(screen.getByText('createDrawer.iconColorLabel')).toBeInTheDocument();
      });

      it('Then the name placeholder is custom-room-specific', () => {
        expect(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' })).toHaveAttribute(
          'placeholder',
          'createDrawer.namePlaceholderCustomRoom',
        );
      });
    });

    describe('When the user clicks the icon/color picker button', () => {
      it('Then the IconColorPicker panel appears', async () => {
        await user.click(screen.getByRole('button', { name: /restaurant/ }));
        expect(
          screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' }),
        ).toBeInTheDocument();
      });
    });

    describe('When the picker is open', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /restaurant/ }));
        await waitFor(() =>
          expect(screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' })).toBeInTheDocument(),
        );
      });

      it('Then clicking Apply closes the picker', async () => {
        await user.click(screen.getByRole('button', { name: 'createDrawer.pickerApply' }));
        expect(screen.queryByRole('dialog', { name: 'createDrawer.customizeIconColor' })).not.toBeInTheDocument();
      });

      it('Then clicking the Cancel button in the footer closes the picker and reverts values', async () => {
        // Change the icon first
        await user.click(screen.getByRole('button', { name: 'hotel' }));
        // Then cancel — should revert to original
        await user.click(screen.getByRole('button', { name: 'createDrawer.pickerCancel' }));
        expect(screen.queryByRole('dialog', { name: 'createDrawer.customizeIconColor' })).not.toBeInTheDocument();
      });

      it('Then clicking outside the picker panel closes it via the mousedown handler', async () => {
        // The name input is outside pickerRef — triggers the document mousedown handler
        await user.pointer({ target: screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), keys: '[MouseLeft>]' });
        expect(screen.queryByRole('dialog', { name: 'createDrawer.customizeIconColor' })).not.toBeInTheDocument();
      });

      it('Then clicking the X close button in the picker header closes the picker', async () => {
        const pickerDialog = screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' });
        await user.click(within(pickerDialog).getByRole('button', { name: 'createDrawer.close' }));
        expect(screen.queryByRole('dialog', { name: 'createDrawer.customizeIconColor' })).not.toBeInTheDocument();
      });

      it('Then clicking an icon in the picker updates the selection', async () => {
        const pickerDialog = screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' });
        await user.click(within(pickerDialog).getByRole('button', { name: 'hotel' }));
        expect(within(pickerDialog).getByRole('button', { name: 'hotel' })).toHaveAttribute('aria-pressed', 'true');
      });

      it('Then clicking a color swatch updates the selection', async () => {
        const pickerDialog = screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' });
        await user.click(within(pickerDialog).getByRole('button', { name: '#EF4444' }));
        expect(within(pickerDialog).getByRole('button', { name: '#EF4444' })).toHaveAttribute('aria-pressed', 'true');
      });

      it('Then typing a valid hex in the custom color input updates the color', async () => {
        const hexInput = screen.getByPlaceholderText('#000000');
        await user.clear(hexInput);
        await user.type(hexInput, '#AABBCC');
        expect(hexInput).toHaveValue('#AABBCC');
      });

      it('Then typing an invalid hex does not update the color selection', async () => {
        const hexInput = screen.getByPlaceholderText('#000000');
        await user.clear(hexInput);
        await user.type(hexInput, 'INVALID');
        expect(hexInput).toHaveValue('INVALID');
      });

      it('Then collapsing the icons section hides the icon grid', async () => {
        const pickerDialog = screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' });
        await user.click(within(pickerDialog).getByRole('button', { name: /createDrawer\.iconSection/ }));
        expect(within(pickerDialog).queryByRole('button', { name: 'restaurant' })).not.toBeInTheDocument();
      });

      it('Then collapsing the colors section hides the color grid', async () => {
        const pickerDialog = screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' });
        await user.click(within(pickerDialog).getByRole('button', { name: /createDrawer\.colorSection/ }));
        expect(within(pickerDialog).queryByRole('button', { name: '#EF4444' })).not.toBeInTheDocument();
      });

      it('Then collapsing the custom color section hides the hex input', async () => {
        const pickerDialog = screen.getByRole('dialog', { name: 'createDrawer.customizeIconColor' });
        await user.click(within(pickerDialog).getByRole('button', { name: /createDrawer\.customColorSection/ }));
        expect(screen.queryByPlaceholderText('#000000')).not.toBeInTheDocument();
      });
    });

    describe('When the user submits with the default icon and color', () => {
      it('Then onCreateCustomRoom is called with icon and color in the payload', async () => {
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'Pop-up Store');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '789 Pop St');
        await user.click(screen.getByRole('button', { name: 'createDrawer.create' }));
        await waitFor(() =>
          expect(onCreateCustomRoom).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Pop-up Store',
              icon: 'restaurant',
              color: '#EC4899',
            }),
          ),
        );
      });
    });
  });

  // ─── Tier limit ───────────────────────────────────────────────────────────

  describe('Given a storage type has reached its tier limit', () => {
    describe('When the type-selection renders with all warehouse slots filled', () => {
      it('Then the WAREHOUSE type card shows the count/limit badge', () => {
        renderDrawer({
          typeCounts: { WAREHOUSE: 3, STORE_ROOM: 0, CUSTOM_ROOM: 0 },
        });
        expect(screen.getByText('3/3')).toBeInTheDocument();
      });
    });

    describe('When the API returns a tier_limit error after submitting', () => {
      it('Then the tier limit warning banner is shown', async () => {
        onCreateWarehouse.mockResolvedValue({ error: 'tier_limit' });
        renderDrawer();
        await navigateToStep2('WAREHOUSE');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.nameLabel' }), 'Over Limit');
        await user.type(screen.getByRole('textbox', { name: 'createDrawer.addressLabel' }), '100 St');
        await user.click(screen.getByRole('button', { name: 'createDrawer.create' }));
        await waitFor(() =>
          expect(screen.getByText('createDrawer.tierLimitWarning')).toBeInTheDocument(),
        );
      });
    });
  });
});
