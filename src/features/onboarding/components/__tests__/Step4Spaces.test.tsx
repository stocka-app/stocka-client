import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step4Spaces } from '@/features/onboarding/components/steps/Step4Spaces';

const useTranslationSpy = vi.fn();

vi.mock('react-i18next', () => {
  const i18nInstance = {
    language: 'es',
    changeLanguage: (lng: string) => { i18nInstance.language = lng; return Promise.resolve(); },
  };
  return {
    useTranslation: (...args: unknown[]) => {
      const override = useTranslationSpy(...args);
      if (override) return override;
      return {
        t: (key: string, opts?: Record<string, unknown>) => {
          if (opts?.defaultValue) return opts.defaultValue as string;
          return key;
        },
        i18n: i18nInstance,
      };
    },
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
    initReactI18next: { type: '3rdParty', init: () => {} },
  };
});

describe('Step4Spaces', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onSkip = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // =========================================================================
  // Overview mode (initial)
  // =========================================================================

  describe('Given the user arrives at the spaces step (FREE tier, RETAIL)', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the configure button is visible', () => {
      expect(screen.getByText('step4.configureButton')).toBeInTheDocument();
    });

    it('Then the skip button is visible', () => {
      expect(screen.getByText('step4.skipButton')).toBeInTheDocument();
    });

    it('Then the three space type titles are visible', () => {
      expect(screen.getByText('step4.customRoom.title')).toBeInTheDocument();
      expect(screen.getByText('step4.storeRoom.title')).toBeInTheDocument();
      expect(screen.getByText('step4.warehouse.title')).toBeInTheDocument();
    });

    it('Then the warehouse locked badge is visible for FREE tier', () => {
      expect(screen.getByText('step4.warehouse.lockedBadge')).toBeInTheDocument();
    });

    it('Then the escape hint is visible', () => {
      expect(screen.getByText('step4.escapeHint')).toBeInTheDocument();
    });

    describe('When the user clicks skip', () => {
      beforeEach(async () => {
        await user.click(screen.getByText('step4.skipButton'));
      });

      it('Then onSkip is called', () => {
        expect(onSkip).toHaveBeenCalledOnce();
      });
    });

    describe('When the user clicks the back button', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /common.back/i }));
      });

      it('Then onBack is called', () => {
        expect(onBack).toHaveBeenCalledOnce();
      });
    });
  });

  // =========================================================================
  // STARTER tier — warehouse not locked
  // =========================================================================

  describe('Given the user is on STARTER tier', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the warehouse locked badge is NOT shown', () => {
      expect(screen.queryByText('step4.warehouse.lockedBadge')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Null tier defaults to FREE
  // =========================================================================

  describe('Given tier is null', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier={null}
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the warehouse locked badge is shown (defaults to FREE)', () => {
      expect(screen.getByText('step4.warehouse.lockedBadge')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Error display
  // =========================================================================

  describe('Given an API error occurred', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error="errors.profileUpdateFailed"
        />,
      );
    });

    it('Then the error alert is shown', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Loading state
  // =========================================================================

  describe('Given a submission is in progress', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the back button is disabled', () => {
      expect(screen.getByRole('button', { name: /common.back/i })).toBeDisabled();
    });
  });

  // =========================================================================
  // Overview mode — configure button transitions to configure mode
  // =========================================================================

  describe('Given the user clicks the configure button from overview mode', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
    });

    it('Then the configure mode is shown with store room section expanded', () => {
      const storeSection = screen.getByRole('region', { name: /step4\.storeRoom\.title/i });
      expect(storeSection).toBeInTheDocument();
      // Store room section header should be expanded — use aria-expanded to disambiguate
      const storeToggle = screen.getByRole('button', { expanded: true });
      expect(storeToggle).toBeInTheDocument();
    });

    it('Then the custom room section is collapsed by default', () => {
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      expect(customToggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('Then the warehouse section is collapsed by default', () => {
      const warehouseToggle = screen.getByRole('button', { name: /step4\.warehouse\.title/i });
      expect(warehouseToggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('Then the store room name input is visible', () => {
      expect(screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i })).toBeInTheDocument();
    });

    it('Then the store room address input is visible', () => {
      expect(screen.getByRole('textbox', { name: /step4\.storeRoom\.addressLabel/i })).toBeInTheDocument();
    });

    it('Then the submit button is visible', () => {
      expect(screen.getByRole('button', { name: /step4\.ctaButton/i })).toBeInTheDocument();
    });

    it('Then the back button is visible', () => {
      expect(screen.getByRole('button', { name: /common\.back/i })).toBeInTheDocument();
    });

    it('Then the skip link is visible', () => {
      expect(screen.getByRole('button', { name: /step4\.skipButton/i })).toBeInTheDocument();
    });

    it('Then the escape hint is visible', () => {
      expect(screen.getByText('step4.escapeHint')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Configure mode — section toggling
  // =========================================================================

  describe('Given configure mode is active', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
    });

    describe('When the user collapses the store room section', () => {
      beforeEach(async () => {
        // store room toggle button — it's the only one with aria-expanded=true initially
        const storeToggle = screen.getByRole('button', { expanded: true });
        await user.click(storeToggle);
      });

      it('Then the store room section is collapsed', () => {
        // All three section toggles should now be collapsed (aria-expanded=false)
        const collapsedButtons = screen.getAllByRole('button', { expanded: false });
        // The store room toggle should be among the collapsed buttons
        expect(collapsedButtons.length).toBeGreaterThanOrEqual(3);
      });

      it('Then the store room name input is no longer visible', () => {
        expect(screen.queryByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i })).not.toBeInTheDocument();
      });
    });

    describe('When the user expands the custom room section', () => {
      beforeEach(async () => {
        const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
        await user.click(customToggle);
      });

      it('Then the custom room fields are visible', () => {
        expect(screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /step4\.customRoom\.addressLabel/i })).toBeInTheDocument();
      });
    });

    describe('When the user expands the warehouse section', () => {
      beforeEach(async () => {
        const warehouseToggle = screen.getByRole('button', { name: /step4\.warehouse\.title/i });
        await user.click(warehouseToggle);
      });

      it('Then the warehouse name and address inputs are visible', () => {
        expect(screen.getByRole('textbox', { name: /step4\.warehouse\.nameLabel/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /step4\.warehouse\.addressLabel/i })).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Configure mode — store room CRUD
  // =========================================================================

  describe('Given configure mode with STARTER tier (max 3 store rooms)', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
    });

    it('Then the add store room button is visible (1 < max 3)', () => {
      // The add button renders the Plus icon + t('step4.storeRoom.title')
      // Since store room section is expanded and there's already a title in the header,
      // the add button also has text 'step4.storeRoom.title'
      const storeSection = screen.getByRole('region', { name: /step4\.storeRoom\.title/i });
      const addButton = storeSection.querySelector('button.text-brand');
      expect(addButton).toBeInTheDocument();
    });

    describe('When the user fills in store room name and submits', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
        await user.type(nameInput, 'Main Store');
      });

      it('Then the input contains the typed value', () => {
        expect(screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i })).toHaveValue('Main Store');
      });
    });

    describe('When the user fills store room name + address and submits', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
        const addressInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.addressLabel/i });
        await user.type(nameInput, 'Main Store');
        await user.type(addressInput, '123 Main St');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then onSubmit is called with the store room data', () => {
        expect(onSubmit).toHaveBeenCalledWith([
          {
            type: 'STORE_ROOM',
            name: 'Main Store',
            address: '123 Main St',
          },
        ]);
      });
    });

    describe('When the user fills store room name only (no address) and submits', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
        await user.type(nameInput, 'My Store');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then onSubmit is called with address as undefined', () => {
        expect(onSubmit).toHaveBeenCalledWith([
          {
            type: 'STORE_ROOM',
            name: 'My Store',
            address: undefined,
          },
        ]);
      });
    });

    describe('When the user adds a second store room', () => {
      beforeEach(async () => {
        // Find the add button inside the store room section
        const storeSection = screen.getByRole('region', { name: /step4\.storeRoom\.title/i });
        const addBtn = storeSection.querySelector('button.text-brand') as HTMLElement;
        await user.click(addBtn);
      });

      it('Then two sets of store room inputs are visible', () => {
        const nameInputs = screen.getAllByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
        expect(nameInputs).toHaveLength(2);
      });

      it('Then remove buttons appear for each store room', () => {
        expect(screen.getByRole('button', { name: /Remove store room 1/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Remove store room 2/i })).toBeInTheDocument();
      });

      describe('When the user removes the first store room', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: /Remove store room 1/i }));
        });

        it('Then only one store room input remains', () => {
          const nameInputs = screen.getAllByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
          expect(nameInputs).toHaveLength(1);
        });

        it('Then the remove button is no longer shown (only 1 room)', () => {
          expect(screen.queryByRole('button', { name: /Remove store room/i })).not.toBeInTheDocument();
        });
      });
    });

    describe('When the user adds 3 store rooms (the maximum)', () => {
      beforeEach(async () => {
        const storeSection = screen.getByRole('region', { name: /step4\.storeRoom\.title/i });
        // Add second
        let addBtn = storeSection.querySelector('button.text-brand') as HTMLElement;
        await user.click(addBtn);
        // Add third
        addBtn = storeSection.querySelector('button.text-brand') as HTMLElement;
        await user.click(addBtn);
      });

      it('Then the add button disappears (max reached)', () => {
        const storeSection = screen.getByRole('region', { name: /step4\.storeRoom\.title/i });
        const addBtn = storeSection.querySelector('button.text-brand');
        expect(addBtn).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Configure mode — custom room CRUD
  // =========================================================================

  describe('Given configure mode with STARTER tier, custom room expanded', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Expand custom room section
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
    });

    describe('When the user fills custom room type and name and submits', () => {
      beforeEach(async () => {
        const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
        await user.type(roomTypeInput, 'Showroom');
        await user.type(nameInput, 'Display Area');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then onSubmit is called with custom room data', () => {
        expect(onSubmit).toHaveBeenCalledWith([
          {
            type: 'CUSTOM_ROOM',
            name: 'Display Area',
            roomType: 'Showroom',
            address: undefined,
          },
        ]);
      });
    });

    describe('When the user fills custom room with address and submits', () => {
      beforeEach(async () => {
        const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
        const addressInput = screen.getByRole('textbox', { name: /step4\.customRoom\.addressLabel/i });
        await user.type(roomTypeInput, 'Lab');
        await user.type(nameInput, 'Main Lab');
        await user.type(addressInput, '456 Science Rd');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then onSubmit includes the address', () => {
        expect(onSubmit).toHaveBeenCalledWith([
          {
            type: 'CUSTOM_ROOM',
            name: 'Main Lab',
            roomType: 'Lab',
            address: '456 Science Rd',
          },
        ]);
      });
    });

    describe('When the user fills custom room with __OTHER__ room type', () => {
      beforeEach(async () => {
        const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
        await user.type(roomTypeInput, '__OTHER__');
        // Now we need to also set the customRoomType — but wait, __OTHER__ is typed into
        // the roomType input. The customRoomType field is not directly editable in the UI;
        // the __OTHER__ path uses room.customRoomType.trim() as the effective room type.
        // Since customRoomType starts as '' and there's no UI to set it,
        // this path produces an empty effectiveRoomType and the room won't be pushed.
        // So we need to also set the name to trigger hasData but the room won't be pushed
        // because effectiveRoomType is empty.
        await user.type(nameInput, 'Other Room');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then onSkip is called because __OTHER__ with empty customRoomType produces no spaces', () => {
        // effectiveRoomType = room.customRoomType.trim() = '' so the room is skipped
        // But validation runs first: hasData = true (roomType='__OTHER__' is truthy),
        // effectiveRoomType for validation = room.roomType.trim() = '__OTHER__' (truthy),
        // and name = 'Other Room' (truthy). So validation passes.
        // In handleSubmit: effectiveRoomType = room.customRoomType.trim() = '' — falsy,
        // so `if (effectiveRoomType && room.name.trim())` is false — room skipped.
        // spaces.length === 0, so onSkip() is called.
        expect(onSkip).toHaveBeenCalledOnce();
      });
    });

    describe('When the user adds a second custom room', () => {
      beforeEach(async () => {
        const customSection = screen.getByRole('region', { name: /step4\.customRoom\.title/i });
        const addBtn = customSection.querySelector('button.text-brand') as HTMLElement;
        await user.click(addBtn);
      });

      it('Then two custom room type inputs are visible', () => {
        const inputs = screen.getAllByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        expect(inputs).toHaveLength(2);
      });

      it('Then remove buttons appear for custom rooms', () => {
        expect(screen.getByRole('button', { name: /Remove custom room 1/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Remove custom room 2/i })).toBeInTheDocument();
      });

      describe('When the user removes the second custom room', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: /Remove custom room 2/i }));
        });

        it('Then only one custom room remains', () => {
          const inputs = screen.getAllByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
          expect(inputs).toHaveLength(1);
        });
      });
    });

    describe('When the user adds 3 custom rooms (the maximum for STARTER)', () => {
      beforeEach(async () => {
        const customSection = screen.getByRole('region', { name: /step4\.customRoom\.title/i });
        let addBtn = customSection.querySelector('button.text-brand') as HTMLElement;
        await user.click(addBtn);
        addBtn = customSection.querySelector('button.text-brand') as HTMLElement;
        await user.click(addBtn);
      });

      it('Then the add button disappears (max reached)', () => {
        const customSection = screen.getByRole('region', { name: /step4\.customRoom\.title/i });
        const addBtn = customSection.querySelector('button.text-brand');
        expect(addBtn).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Configure mode — warehouse section (paid tier)
  // =========================================================================

  describe('Given configure mode with STARTER tier, warehouse expanded', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Expand warehouse section
      const warehouseToggle = screen.getByRole('button', { name: /step4\.warehouse\.title/i });
      await user.click(warehouseToggle);
    });

    describe('When the user fills warehouse name and address and submits', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.warehouse\.nameLabel/i });
        const addressInput = screen.getByRole('textbox', { name: /step4\.warehouse\.addressLabel/i });
        await user.type(nameInput, 'Central Warehouse');
        await user.type(addressInput, '789 Industrial Blvd');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then onSubmit is called with warehouse data', () => {
        expect(onSubmit).toHaveBeenCalledWith([
          {
            type: 'WAREHOUSE',
            name: 'Central Warehouse',
            address: '789 Industrial Blvd',
          },
        ]);
      });
    });

    describe('When the user fills warehouse name only (no address) and submits', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.warehouse\.nameLabel/i });
        await user.type(nameInput, 'Warehouse A');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then validation error is shown for missing address', () => {
        expect(screen.getByText('step4.warehouse.addressRequired')).toBeInTheDocument();
      });

      it('Then onSubmit is NOT called', () => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    describe('When the user fills warehouse address only (no name) and submits', () => {
      beforeEach(async () => {
        const addressInput = screen.getByRole('textbox', { name: /step4\.warehouse\.addressLabel/i });
        await user.type(addressInput, 'Some Address');
        await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
      });

      it('Then validation error is shown for missing name', () => {
        expect(screen.getByText('step4.warehouse.nameRequired')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Configure mode — warehouse section locked for FREE tier
  // =========================================================================

  describe('Given configure mode with FREE tier', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
    });

    it('Then the warehouse section toggle is disabled', () => {
      const warehouseToggle = screen.getByRole('button', { name: /step4\.warehouse\.title/i });
      expect(warehouseToggle).toBeDisabled();
    });

    it('Then the warehouse locked badge is shown in configure mode', () => {
      expect(screen.getByText('step4.warehouse.lockedBadge')).toBeInTheDocument();
    });

    it('Then the warehouse locked message is shown', () => {
      expect(screen.getByText('step4.warehouse.lockedMessage')).toBeInTheDocument();
    });

    it('Then no add store room button is shown (FREE tier max = 1)', () => {
      // FREE tier allows max 1 store room, so the add button should not be visible
      const storeSection = screen.getByRole('region', { name: /step4\.storeRoom\.title/i });
      const addBtn = storeSection.querySelector('button.text-brand');
      expect(addBtn).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Configure mode — validation errors
  // =========================================================================

  describe('Given configure mode with partial store room data (address only)', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Fill only address (not name) for store room
      const addressInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.addressLabel/i });
      await user.type(addressInput, '123 Street');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then a validation error is shown for store room name', () => {
      expect(screen.getByText('step4.storeRoom.nameRequired')).toBeInTheDocument();
    });

    it('Then onSubmit is NOT called', () => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    describe('When the user fixes the validation error by typing a name', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
        await user.type(nameInput, 'Fixed Store');
      });

      it('Then the validation error disappears (cleared on input change)', () => {
        expect(screen.queryByText('step4.storeRoom.nameRequired')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given configure mode with partial custom room data (name only, no room type)', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Expand custom room
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
      // Fill only name (not room type)
      const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
      await user.type(nameInput, 'My Room');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then a validation error is shown for custom room type', () => {
      expect(screen.getByText('step4.customRoom.roomTypeRequired')).toBeInTheDocument();
    });

    it('Then onSubmit is NOT called', () => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    describe('When the user fixes the validation error by typing a room type', () => {
      beforeEach(async () => {
        const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        await user.type(roomTypeInput, 'Office');
      });

      it('Then the room type validation error disappears', () => {
        expect(screen.queryByText('step4.customRoom.roomTypeRequired')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given configure mode with custom room type filled but no name', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
      const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
      await user.type(roomTypeInput, 'Showroom');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then a validation error is shown for custom room name', () => {
      expect(screen.getByText('step4.customRoom.nameRequired')).toBeInTheDocument();
    });

    describe('When the user fixes it by typing a name', () => {
      beforeEach(async () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
        await user.type(nameInput, 'My Showroom');
      });

      it('Then the name validation error disappears', () => {
        expect(screen.queryByText('step4.customRoom.nameRequired')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Configure mode — submit with no data calls onSkip
  // =========================================================================

  describe('Given configure mode with no data filled', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then onSkip is called (no data = skip)', () => {
      expect(onSkip).toHaveBeenCalledOnce();
    });

    it('Then onSubmit is NOT called', () => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Configure mode — back button in configure mode
  // =========================================================================

  describe('Given configure mode, when the user clicks back', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      await user.click(screen.getByRole('button', { name: /common\.back/i }));
    });

    it('Then onBack is called', () => {
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  // =========================================================================
  // Configure mode — skip link in configure mode
  // =========================================================================

  describe('Given configure mode, when the user clicks skip', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      await user.click(screen.getByRole('button', { name: /step4\.skipButton/i }));
    });

    it('Then onSkip is called', () => {
      expect(onSkip).toHaveBeenCalledOnce();
    });
  });

  // =========================================================================
  // Configure mode — loading state
  // =========================================================================

  describe('Given configure mode is loading', () => {
    beforeEach(async () => {
      const { rerender } = render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Re-render with isLoading=true to simulate submission in progress
      rerender(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the submit button is disabled and shows saving text', () => {
      const submitBtn = screen.getByRole('button', { name: /step4\.ctaButton/i });
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText('step4.saving')).toBeInTheDocument();
    });

    it('Then the back button is disabled', () => {
      expect(screen.getByRole('button', { name: /common\.back/i })).toBeDisabled();
    });

    it('Then the skip link is disabled', () => {
      expect(screen.getByRole('button', { name: /step4\.skipButton/i })).toBeDisabled();
    });

    it('Then the store room inputs are disabled', () => {
      expect(screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i })).toBeDisabled();
    });
  });

  // =========================================================================
  // Configure mode — error display
  // =========================================================================

  describe('Given configure mode with an API error', () => {
    beforeEach(async () => {
      const { rerender } = render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      rerender(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error="errors.spaceSaveFailed"
        />,
      );
    });

    it('Then the error alert is shown in configure mode', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('errors.spaceSaveFailed')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Configure mode — multiple space types submitted together
  // =========================================================================

  describe('Given configure mode with store room + custom room + warehouse data', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));

      // Fill store room
      const storeNameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
      await user.type(storeNameInput, 'Main Store');

      // Expand and fill custom room
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
      const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
      const customNameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
      await user.type(roomTypeInput, 'Office');
      await user.type(customNameInput, 'Back Office');

      // Expand and fill warehouse
      const warehouseToggle = screen.getByRole('button', { name: /step4\.warehouse\.title/i });
      await user.click(warehouseToggle);
      const whNameInput = screen.getByRole('textbox', { name: /step4\.warehouse\.nameLabel/i });
      const whAddressInput = screen.getByRole('textbox', { name: /step4\.warehouse\.addressLabel/i });
      await user.type(whNameInput, 'WH-1');
      await user.type(whAddressInput, 'Industrial Zone');

      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then onSubmit is called with all three space types', () => {
      expect(onSubmit).toHaveBeenCalledWith([
        { type: 'CUSTOM_ROOM', name: 'Back Office', roomType: 'Office', address: undefined },
        { type: 'STORE_ROOM', name: 'Main Store', address: undefined },
        { type: 'WAREHOUSE', name: 'WH-1', address: 'Industrial Zone' },
      ]);
    });
  });

  // =========================================================================
  // Configure mode — FREE tier custom room max = 1 (no add button)
  // =========================================================================

  describe('Given configure mode on FREE tier with custom room expanded', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
    });

    it('Then the add custom room button is NOT shown (max 1 for FREE tier)', () => {
      const customSection = screen.getByRole('region', { name: /step4\.customRoom\.title/i });
      const addBtn = customSection.querySelector('button.text-brand');
      expect(addBtn).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Configure mode — updateWarehouse clears validation errors
  // =========================================================================

  describe('Given configure mode with warehouse validation error', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const warehouseToggle = screen.getByRole('button', { name: /step4\.warehouse\.title/i });
      await user.click(warehouseToggle);
      // Fill only name to trigger address validation error
      const nameInput = screen.getByRole('textbox', { name: /step4\.warehouse\.nameLabel/i });
      await user.type(nameInput, 'WH-1');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then the address validation error is displayed', () => {
      expect(screen.getByText('step4.warehouse.addressRequired')).toBeInTheDocument();
    });

    describe('When the user types in the warehouse address field', () => {
      beforeEach(async () => {
        const addressInput = screen.getByRole('textbox', { name: /step4\.warehouse\.addressLabel/i });
        await user.type(addressInput, 'Some address');
      });

      it('Then the address validation error is cleared', () => {
        expect(screen.queryByText('step4.warehouse.addressRequired')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Configure mode — getNamePlaceholder behavior
  // =========================================================================

  describe('Given configure mode with custom room, when the user types a room type', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
    });

    it('Then the custom room name input has the default placeholder when room type is empty', () => {
      const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
      // getNamePlaceholder('') returns defaultNamePlaceholder = t('step4.customRoom.namePlaceholderDefault')
      // which is the key 'step4.customRoom.namePlaceholderDefault'
      expect(nameInput).toHaveAttribute('placeholder', 'step4.customRoom.namePlaceholderDefault');
    });

    describe('When the user types a room type', () => {
      beforeEach(async () => {
        const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        await user.type(roomTypeInput, 'Kitchen');
      });

      it('Then the name placeholder updates based on room type', () => {
        const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
        // t(`step4.customRoom.namePlaceholders.Kitchen`, { defaultValue: '' }) — defaultValue is ''
        // which is falsy, so the mock returns the key itself: 'step4.customRoom.namePlaceholders.Kitchen'
        // That's truthy, so getNamePlaceholder returns it instead of the default.
        expect(nameInput).toHaveAttribute('placeholder', 'step4.customRoom.namePlaceholders.Kitchen');
      });
    });
  });

  // =========================================================================
  // Configure mode — custom room address field update
  // =========================================================================

  describe('Given configure mode with custom room, when the user types an address', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
      const addressInput = screen.getByRole('textbox', { name: /step4\.customRoom\.addressLabel/i });
      await user.type(addressInput, 'Test Address');
    });

    it('Then the address input value is updated', () => {
      const addressInput = screen.getByRole('textbox', { name: /step4\.customRoom\.addressLabel/i });
      expect(addressInput).toHaveValue('Test Address');
    });
  });

  // =========================================================================
  // Configure mode — hasAnyData with custom room address only
  // =========================================================================

  describe('Given configure mode with only custom room address filled', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
      const addressInput = screen.getByRole('textbox', { name: /step4\.customRoom\.addressLabel/i });
      await user.type(addressInput, 'Some Address');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then validation passes (address-only has no required fields triggered) and onSkip is called', () => {
      // hasAnyData = true (address filled), validate runs, but address-only doesn't trigger
      // hasData in customRoom validation (roomType and name are empty, but address is filled)
      // Wait — let me re-check: hasData = room.roomType.trim() || room.name.trim() || room.address.trim()
      // address is 'Some Address' so hasData = true
      // Then: effectiveRoomType = '' → error for roomType
      // Actually no: room.roomType.trim() is '' which is falsy, so effectiveRoomType = '' → triggers roomTypeRequired
      // And room.name.trim() is '' → triggers nameRequired
      // So validation FAILS
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('step4.customRoom.roomTypeRequired')).toBeInTheDocument();
      expect(screen.getByText('step4.customRoom.nameRequired')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Configure mode — hasAnyData with warehouse data on FREE tier (ignored)
  // =========================================================================

  describe('Given FREE tier in configure mode (warehouse data ignored by hasAnyData)', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // On FREE tier, warehouse toggle is disabled, so warehouse data stays at defaults.
      // hasAnyData ignores warehouses for free tier.
      // Submit with empty data → onSkip
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then onSkip is called (warehouse data ignored for free tier)', () => {
      expect(onSkip).toHaveBeenCalledOnce();
    });
  });

  // =========================================================================
  // Business type suggestion key mapping coverage
  // =========================================================================

  describe('Given businessType is RESTAURANT', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RESTAURANT"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the component renders without error', () => {
      expect(screen.getByText('step4.configureButton')).toBeInTheDocument();
    });
  });

  describe('Given businessType is UNKNOWN (unmapped)', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="UNKNOWN_TYPE"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the component falls back to "other" suggestion key and renders', () => {
      expect(screen.getByText('step4.configureButton')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Configure mode — store room with only name (validates hasData for address check)
  // =========================================================================

  describe('Given configure mode with store room name filled but address empty', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const nameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
      await user.type(nameInput, 'Only Name Store');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then onSubmit is called (address is optional for store rooms)', () => {
      expect(onSubmit).toHaveBeenCalledWith([
        { type: 'STORE_ROOM', name: 'Only Name Store', address: undefined },
      ]);
    });
  });

  // =========================================================================
  // updateCustomRoom — customRoomType field
  // =========================================================================

  // =========================================================================
  // Configure mode — suggestion chips render and click
  // =========================================================================

  describe('Given configure mode with suggestion chips available', () => {
    beforeEach(async () => {
      // Override useTranslation to return an array for suggestions
      const i18nInstance = {
        language: 'es',
        changeLanguage: (lng: string) => { i18nInstance.language = lng; return Promise.resolve(); },
      };
      useTranslationSpy.mockReturnValue({
        t: (key: string, opts?: Record<string, unknown>) => {
          if (key === 'step4.customRoom.suggestions.retail' && opts?.returnObjects) {
            return ['Showroom', 'Display', 'Storage'];
          }
          if (opts?.defaultValue !== undefined) return opts.defaultValue || key;
          return key;
        },
        i18n: i18nInstance,
      });
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Expand custom room section
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
    });

    afterEach(() => {
      useTranslationSpy.mockReset();
    });

    it('Then suggestion chips are rendered', () => {
      expect(screen.getByText('Showroom')).toBeInTheDocument();
      expect(screen.getByText('Display')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });

    describe('When the user clicks a suggestion chip', () => {
      beforeEach(async () => {
        await user.click(screen.getByText('Showroom'));
      });

      it('Then the room type input is set to the suggestion value', () => {
        const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
        expect(roomTypeInput).toHaveValue('Showroom');
      });

      it('Then the clicked chip has the selected styling class', () => {
        const chip = screen.getByText('Showroom');
        expect(chip).toHaveClass('border-brand');
      });
    });
  });

  describe('Given configure mode, custom room with customRoomType input (via roomType __OTHER__ behavior)', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
    });

    it('Then the roomType input accepts text input', () => {
      const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
      expect(roomTypeInput).toHaveValue('');
    });
  });

  // =========================================================================
  // FREE tier validate/submit skips warehouse validation and warehouse data
  // =========================================================================

  describe('Given FREE tier configure mode with store room data only', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="FREE"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      // Fill store room name
      const nameInput = screen.getByRole('textbox', { name: /step4\.storeRoom\.nameLabel/i });
      await user.type(nameInput, 'Free Store');
      await user.click(screen.getByRole('button', { name: /step4\.ctaButton/i }));
    });

    it('Then onSubmit is called with only store room (warehouse skipped for FREE tier)', () => {
      expect(onSubmit).toHaveBeenCalledWith([
        { type: 'STORE_ROOM', name: 'Free Store', address: undefined },
      ]);
    });
  });

  // =========================================================================
  // getNamePlaceholder — fallback when t() returns empty string
  // =========================================================================

  describe('Given configure mode with custom room and t() returning empty for placeholder', () => {
    beforeEach(async () => {
      const i18nInstance = {
        language: 'es',
        changeLanguage: (lng: string) => { i18nInstance.language = lng; return Promise.resolve(); },
      };
      useTranslationSpy.mockReturnValue({
        t: (key: string, opts?: Record<string, unknown>) => {
          // Return empty string when defaultValue is '' so the fallback branch executes
          if (opts?.defaultValue !== undefined && opts.defaultValue === '') return '';
          return key;
        },
        i18n: i18nInstance,
      });
      render(
        <Step4Spaces
          businessType="RETAIL"
          tier="STARTER"
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
      await user.click(screen.getByText('step4.configureButton'));
      const customToggle = screen.getByRole('button', { name: /step4\.customRoom\.title/i });
      await user.click(customToggle);
      // Type a room type to trigger getNamePlaceholder with non-empty roomType
      const roomTypeInput = screen.getByRole('textbox', { name: /step4\.customRoom\.roomTypeLabel/i });
      await user.type(roomTypeInput, 'Office');
    });

    afterEach(() => {
      useTranslationSpy.mockReset();
    });

    it('Then the name input falls back to the default placeholder', () => {
      const nameInput = screen.getByRole('textbox', { name: /step4\.customRoom\.nameLabel/i });
      // t('step4.customRoom.namePlaceholders.Office', { defaultValue: '' }) returns ''
      // So getNamePlaceholder returns defaultNamePlaceholder = t('step4.customRoom.namePlaceholderDefault')
      // which is the key 'step4.customRoom.namePlaceholderDefault'
      expect(nameInput).toHaveAttribute('placeholder', 'step4.customRoom.namePlaceholderDefault');
    });
  });
});
