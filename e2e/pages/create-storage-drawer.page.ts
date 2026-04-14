import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the CreateStorageDrawer.
 *
 * The drawer has two steps:
 *   Step 1 — Type selection: three radio cards (Warehouse, Store Room, Custom area)
 *   Step 2 — Details form: name, address, description, icon/color, submit
 *
 * All locator strategies are derived from the actual DOM structure in
 * CreateStorageDrawer.tsx. Labels use EN locale values.
 */
export class CreateStorageDrawerPage {
  readonly page: Page;

  // ── Drawer container ──────────────────────────────────────────────────────
  /** The main drawer panel (role="dialog") */
  readonly drawer: Locator;

  // ── Step 1 — Type cards ───────────────────────────────────────────────────
  /** The Warehouse type card */
  readonly warehouseCard: Locator;
  /** The Store Room type card */
  readonly storeRoomCard: Locator;
  /** The Custom area type card */
  readonly customRoomCard: Locator;
  /** "STARTER+" lock badge on the Warehouse card when WAREHOUSE is tier-blocked */
  readonly warehouseLockedBadge: Locator;

  // ── Tier-lock upgrade modal ───────────────────────────────────────────────
  /** Global upgrade modal — opens when a tier-locked type card is clicked */
  readonly upgradeModal: Locator;

  // ── Step 2 — Form fields ──────────────────────────────────────────────────
  /** Name text input */
  readonly nameInput: Locator;
  /** Address text input */
  readonly addressInput: Locator;
  /** Description textarea */
  readonly descriptionTextarea: Locator;

  // ── Step 2 — Navigation / actions ────────────────────────────────────────
  /** "← Change type" link inside the type banner */
  readonly changeTypeButton: Locator;
  /** "Create storage" submit button */
  readonly submitButton: Locator;
  /** "Back" / cancel button in the step-2 footer */
  readonly cancelButton: Locator;

  // ── Header close button ───────────────────────────────────────────────────
  /** × close button in the drawer header */
  readonly closeButton: Locator;

  // ── Error / warning states ────────────────────────────────────────────────
  /** Inline "name already taken" error message under the name field */
  readonly nameTakenError: Locator;
  /** Server error banner inside the form */
  readonly serverErrorBanner: Locator;
  /** Tier limit warning banner inside the details step */
  readonly tierLimitBanner: Locator;
  /** "See plans" CTA inside the tier limit banner */
  readonly tierLimitCta: Locator;

  // ── Misc ──────────────────────────────────────────────────────────────────
  /** Name chars remaining counter ("N remaining") */
  readonly nameCharsCounter: Locator;
  /** Icon and color section label / button area */
  readonly iconColorSection: Locator;
  /** Cancel confirmation dialog (role="dialog" inside fixed overlay) */
  readonly cancelConfirmDialog: Locator;
  /** "Keep editing" button inside the cancel confirm dialog */
  readonly keepEditingButton: Locator;
  /** "Abandon" button inside the cancel confirm dialog */
  readonly abandonButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // The drawer panel — matches the `role="dialog"` with the heading "New storage"
    this.drawer = page.getByRole('dialog', { name: 'New storage' });

    // Type cards — located by data-testid attribute set in TypeSelectionBody
    this.warehouseCard = page.getByTestId('type-card-WAREHOUSE');
    this.storeRoomCard = page.getByTestId('type-card-STORE_ROOM');
    this.customRoomCard = page.getByTestId('type-card-CUSTOM_ROOM');
    this.warehouseLockedBadge = page.getByTestId('type-card-WAREHOUSE').getByText('STARTER+');

    // Footer buttons — scoped to the drawer so we don't pick up the picker dialog buttons
    this.cancelButton = this.drawer.getByRole('button', { name: 'Back' });
    this.upgradeModal = page.getByRole('dialog', { name: 'Upgrade your plan' });
    this.submitButton = this.drawer.getByRole('button', { name: /Create storage|Creating\.\.\./ });

    // Close button — aria-label="Close" on the × icon in the header
    this.closeButton = this.drawer.getByRole('button', { name: 'Close' });

    // Form fields — located by their label text
    this.nameInput = page.getByLabel(/^Name/);
    this.addressInput = page.getByLabel(/^Address/);
    this.descriptionTextarea = page.getByLabel(/^Description/);

    // "← Change type" link button inside the type banner
    this.changeTypeButton = page.getByRole('button', { name: '← Change type' });

    // Error states
    this.nameTakenError = page.getByText(
      'An installation with that name already exists. Choose a different one so your team can tell them apart.',
    );
    this.serverErrorBanner = page.getByText(
      "We couldn't create the installation. Check your connection and try again. Your data was not lost.",
    );
    this.tierLimitBanner = page.getByText(/Upgrade to add more\./);
    this.tierLimitCta = page.getByRole('button', { name: 'See plans' });

    // Name chars counter — text like "70 remaining".
    // Scoped to .first() because the address field renders a sibling counter with the same format.
    this.nameCharsCounter = page.getByText(/\d+ remaining/).first();

    // Icon & color section — the label "Icon and color" / "Fixed icon and color"
    this.iconColorSection = page.getByText(/Icon and color|Fixed icon and color/);

    // Cancel confirmation dialog — second role="dialog" on the page (the overlay one)
    this.cancelConfirmDialog = page.getByRole('dialog', { name: 'Abandon creation?' });

    // Dialog action buttons
    this.keepEditingButton = page.getByRole('button', { name: 'Keep editing' });
    this.abandonButton = page.getByRole('button', { name: 'Abandon' });
  }

  // ── Helper methods ─────────────────────────────────────────────────────────

  /**
   * Opens the drawer from whichever entry point is available:
   * - "New storage" header button (when the storages list is non-empty)
   * - "Create my first storage" empty-state CTA (when the list is empty)
   *
   * Waits for either entry point to become visible before clicking, so the
   * method is safe to call immediately after setupAndNavigate (before list
   * data has rendered).
   */
  async openDrawer(): Promise<void> {
    const headerButton = this.page.getByRole('button', { name: 'New storage' });
    const emptyStateCTA = this.page.getByRole('button', { name: 'Create my first storage' });

    // Wait for whichever button appears first
    await headerButton.or(emptyStateCTA).first().waitFor({ state: 'visible', timeout: 10_000 });

    if (await headerButton.isVisible()) {
      await headerButton.click();
    } else {
      await emptyStateCTA.click();
    }
    await this.drawer.waitFor({ state: 'visible', timeout: 5_000 });
  }

  /**
   * Selects a storage type in step 1 by clicking the corresponding radio card.
   */
  async selectType(type: 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM'): Promise<void> {
    const card = {
      WAREHOUSE: this.warehouseCard,
      STORE_ROOM: this.storeRoomCard,
      CUSTOM_ROOM: this.customRoomCard,
    }[type];
    await card.click();
  }

  /**
   * Fills step-2 form fields. All fields are optional — only specified ones are filled.
   */
  async fillStep2(fields: {
    name?: string;
    address?: string;
    description?: string;
  }): Promise<void> {
    if (fields.name !== undefined) {
      await this.nameInput.fill(fields.name);
    }
    if (fields.address !== undefined) {
      await this.addressInput.fill(fields.address);
    }
    if (fields.description !== undefined) {
      await this.descriptionTextarea.fill(fields.description);
    }
  }

  /**
   * Clicks the "Create storage" submit button.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
