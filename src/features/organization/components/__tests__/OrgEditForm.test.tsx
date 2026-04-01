import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgEditForm } from '@/features/organization/components/OrgEditForm';
import type { OrgProfile } from '@/features/organization/types/organization.types';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn().mockResolvedValue(undefined),
  uploadLogo: vi.fn().mockResolvedValue(undefined),
  checkNameAvailability: vi.fn(),
  isSaving: false,
  isCheckingName: false,
  nameAvailable: null as boolean | null,
}));

vi.mock('@/features/organization/hooks/useOrganization', () => ({
  useOrganization: vi.fn(() => ({
    isSaving: mocks.isSaving,
    isCheckingName: mocks.isCheckingName,
    nameAvailable: mocks.nameAvailable,
    updateProfile: mocks.updateProfile,
    uploadLogo: mocks.uploadLogo,
    checkNameAvailability: mocks.checkNameAvailability,
  })),
}));

const mockProfile: OrgProfile = {
  id: 'tenant-uuid-001',
  name: 'Ferretería Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL',
  rfc: 'FCE123456789',
  logoUrl: null,
  status: 'ACTIVE',
  tier: 'STARTER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function getUseOrganizationMock(): Promise<ReturnType<typeof vi.fn>> {
  const { useOrganization } = await import('@/features/organization/hooks/useOrganization');
  return useOrganization as ReturnType<typeof vi.fn>;
}

describe('OrgEditForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mocks.isSaving = false;
    mocks.isCheckingName = false;
    mocks.nameAvailable = null;
    mocks.updateProfile = vi.fn().mockResolvedValue(undefined);
    mocks.uploadLogo = vi.fn().mockResolvedValue(undefined);
    mocks.checkNameAvailability = vi.fn();
    // Reset the mock to the default dynamic factory so that tests that call
    // useOrganizationMock.mockReturnValue() don't leak into subsequent tests.
    const { useOrganization } = await import('@/features/organization/hooks/useOrganization');
    (useOrganization as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      isSaving: mocks.isSaving,
      isCheckingName: mocks.isCheckingName,
      nameAvailable: mocks.nameAvailable,
      updateProfile: mocks.updateProfile,
      uploadLogo: mocks.uploadLogo,
      checkNameAvailability: mocks.checkNameAvailability,
    }));
  });

  // =========================================================================
  // Initial render
  // =========================================================================

  describe('Given a loaded profile', () => {
    describe('When the form renders', () => {
      it('Then the name field is pre-filled with the current business name', () => {
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
        const nameInput = screen.getByRole('textbox', { name: 'profile.fields.name' });
        expect(nameInput).toHaveValue('Ferretería Central');
      });

      it('Then the RFC field is pre-filled', () => {
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
        const rfcInput = screen.getByRole('textbox', { name: 'profile.fields.rfc' });
        expect(rfcInput).toHaveValue('FCE123456789');
      });

      it('Then the Save button is visible', () => {
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'profile.saveButton' })).toBeInTheDocument();
      });

      it('Then the Cancel button is visible', () => {
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'profile.cancelButton' })).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Cancel
  // =========================================================================

  describe('Given the user decides not to save changes', () => {
    describe('When the user clicks Cancel', () => {
      it('Then the onCancel callback is called', async () => {
        const onCancel = vi.fn();
        render(<OrgEditForm profile={mockProfile} onCancel={onCancel} onSaved={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'profile.cancelButton' }));
        expect(onCancel).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // Successful submit
  // =========================================================================

  describe('Given the user fills in a valid form', () => {
    describe('When the user submits the form', () => {
      it('Then updateProfile is called with the form data', async () => {
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);

        const nameInput = screen.getByRole('textbox', { name: 'profile.fields.name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Nuevo Nombre');

        await user.click(screen.getByRole('button', { name: 'profile.saveButton' }));

        await waitFor(() => {
          expect(mocks.updateProfile).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Nuevo Nombre' }),
          );
        });
      });

      it('Then the onSaved callback is called after success', async () => {
        const onSaved = vi.fn();
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={onSaved} />);

        await user.click(screen.getByRole('button', { name: 'profile.saveButton' }));

        await waitFor(() => {
          expect(onSaved).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  // =========================================================================
  // Saving state
  // =========================================================================

  describe('Given the form is saving', () => {
    describe('When isSaving is true', () => {
      it('Then the Save button shows the saving label', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: true,
          isCheckingName: false,
          nameAvailable: null,
          updateProfile: mocks.updateProfile,
          uploadLogo: mocks.uploadLogo,
          checkNameAvailability: mocks.checkNameAvailability,
        });

        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
        expect(screen.getByText('profile.saving')).toBeInTheDocument();
      });

      it('Then the Save button is disabled', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: true,
          isCheckingName: false,
          nameAvailable: null,
          updateProfile: mocks.updateProfile,
          uploadLogo: mocks.uploadLogo,
          checkNameAvailability: mocks.checkNameAvailability,
        });

        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'profile.saving' })).toBeDisabled();
      });
    });
  });

  // =========================================================================
  // Name availability check UI
  // =========================================================================

  describe('Given the user types a different business name', () => {
    describe('When the name check is in progress', () => {
      it('Then a checking indicator is visible', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: false,
          isCheckingName: true,
          nameAvailable: null,
          updateProfile: mocks.updateProfile,
          uploadLogo: mocks.uploadLogo,
          checkNameAvailability: mocks.checkNameAvailability,
        });

        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);

        const nameInput = screen.getByRole('textbox', { name: 'profile.fields.name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Nombre Nuevo');

        expect(screen.getByLabelText('nameCheck.checking')).toBeInTheDocument();
      });
    });

    describe('When the name is available', () => {
      it('Then the available status is shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: false,
          isCheckingName: false,
          nameAvailable: true,
          updateProfile: mocks.updateProfile,
          uploadLogo: mocks.uploadLogo,
          checkNameAvailability: mocks.checkNameAvailability,
        });

        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);

        const nameInput = screen.getByRole('textbox', { name: 'profile.fields.name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Nombre Disponible');

        expect(screen.getAllByText('nameCheck.available').length).toBeGreaterThan(0);
      });
    });

    describe('When the name is not available', () => {
      it('Then the unavailable status is shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: false,
          isCheckingName: false,
          nameAvailable: false,
          updateProfile: mocks.updateProfile,
          uploadLogo: mocks.uploadLogo,
          checkNameAvailability: mocks.checkNameAvailability,
        });

        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);

        const nameInput = screen.getByRole('textbox', { name: 'profile.fields.name' });
        await user.clear(nameInput);
        await user.type(nameInput, 'Nombre Tomado');

        expect(screen.getAllByText('nameCheck.unavailable').length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // Logo with existing preview
  // =========================================================================

  describe('Given the profile has an existing logo', () => {
    describe('When the form renders', () => {
      it('Then a preview of the current logo is shown', () => {
        render(
          <OrgEditForm
            profile={{ ...mockProfile, logoUrl: 'https://cdn.example.com/logo.png' }}
            onCancel={vi.fn()}
            onSaved={vi.fn()}
          />,
        );
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
      });
    });
  });

  // =========================================================================
  // Logo upload
  // =========================================================================

  describe('Given the user selects a logo file', () => {
    describe('When the file input changes', () => {
      it('Then uploadLogo is called with the selected file', async () => {
        render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);

        const file = new File(['logo content'], 'logo.png', { type: 'image/png' });
        const fileInput = screen.getByLabelText('profile.fields.logo');
        await user.upload(fileInput, file);

        expect(mocks.uploadLogo).toHaveBeenCalledWith(file);
      });
    });
  });

  // =========================================================================
  // Validation errors
  // =========================================================================

  describe('Given the profile has no RFC', () => {
    it('Then the RFC field defaults to empty string', () => {
      render(
        <OrgEditForm profile={{ ...mockProfile, rfc: null }} onCancel={vi.fn()} onSaved={vi.fn()} />,
      );
      const rfcInput = screen.getByRole('textbox', { name: 'profile.fields.rfc' });
      expect(rfcInput).toHaveValue('');
    });
  });

  describe('Given the user submits with an empty business name', () => {
    beforeEach(async () => {
      render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
      await user.clear(screen.getByRole('textbox', { name: 'profile.fields.name' }));
      await user.click(screen.getByRole('button', { name: 'profile.saveButton' }));
    });

    it('Then shows the name field validation error', () => {
      expect(document.getElementById('org-name-error')).toBeInTheDocument();
    });

    it('Then the name input shows error border styling', () => {
      const nameInput = screen.getByRole('textbox', { name: 'profile.fields.name' });
      expect(nameInput.className).toContain('border-red');
    });
  });

  describe('Given the user selects no business type and submits', () => {
    beforeEach(async () => {
      render(<OrgEditForm profile={mockProfile} onCancel={vi.fn()} onSaved={vi.fn()} />);
      const select = screen.getByRole('combobox', { name: 'profile.fields.businessType' });
      await user.selectOptions(select, '');
      await user.click(screen.getByRole('button', { name: 'profile.saveButton' }));
    });

    it('Then the business type select shows error border styling', () => {
      const select = screen.getByRole('combobox', { name: 'profile.fields.businessType' });
      expect(select.className).toContain('border-red');
    });

    it('Then updateProfile is not called', () => {
      expect(mocks.updateProfile).not.toHaveBeenCalled();
    });
  });

});
