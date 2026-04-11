import type { Locator, Page } from '@playwright/test';

export class EditStorageDrawerPage {
  readonly page: Page;
  readonly drawer: Locator;
  readonly title: Locator;
  readonly nameInput: Locator;
  readonly addressInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  // Unsaved changes dialog
  readonly unsavedDialog: Locator;
  readonly keepEditingButton: Locator;
  readonly discardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawer = page.getByRole('dialog');
    this.title = this.drawer.getByRole('heading', { name: /edit storage|editar instalación/i });
    this.nameInput = this.drawer.locator('input[id*="name"]');
    this.addressInput = this.drawer.locator('input[id*="address"]');
    this.descriptionInput = this.drawer.locator('textarea');
    this.submitButton = this.drawer.getByRole('button', { name: /save changes|guardar cambios/i });
    this.cancelButton = this.drawer.getByRole('button', { name: /cancel|cancelar/i });
    this.closeButton = this.drawer.getByLabel(/cancel|cancelar/i);

    // Unsaved dialog is rendered outside the drawer
    this.unsavedDialog = page.getByRole('dialog').filter({ hasText: /discard|descartar/i });
    this.keepEditingButton = page.getByRole('button', { name: /keep editing|seguir editando/i });
    this.discardButton = page.getByRole('button', { name: /discard|descartar/i });
  }

  async fillName(value: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(value);
  }

  async fillAddress(value: string): Promise<void> {
    await this.addressInput.clear();
    await this.addressInput.fill(value);
  }

  async fillDescription(value: string): Promise<void> {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(value);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  typeCard(type: 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM'): Locator {
    const labels: Record<string, RegExp> = {
      WAREHOUSE: /almacén|warehouse/i,
      STORE_ROOM: /bodega|store room/i,
      CUSTOM_ROOM: /personalizada|custom/i,
    };
    return this.drawer.getByRole('button', { name: labels[type] });
  }
}
