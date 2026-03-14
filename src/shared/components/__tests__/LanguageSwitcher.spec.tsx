import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

const mockChangeLanguage = vi.fn();
const mockI18n = {
  language: 'en',
  changeLanguage: mockChangeLanguage,
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe('LanguageSwitcher', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockI18n.language = 'en';
  });

  describe('Given the current language is English', () => {
    it('Then it renders the English flag and label', () => {
      render(<LanguageSwitcher />);
      expect(screen.getByText(/English/)).toBeInTheDocument();
    });
  });

  describe('Given the current language is Spanish', () => {
    beforeEach(() => {
      mockI18n.language = 'es';
    });

    it('Then it renders the Spanish flag and label', () => {
      render(<LanguageSwitcher />);
      expect(screen.getByText(/Español/)).toBeInTheDocument();
    });
  });

  describe('Given the current language is an unsupported code', () => {
    beforeEach(() => {
      mockI18n.language = 'fr';
    });

    it('Then it falls back to English as the default language', () => {
      render(<LanguageSwitcher />);
      expect(screen.getByText(/English/)).toBeInTheDocument();
    });
  });

  describe('Given the user opens the language dropdown and selects Español', () => {
    it('Then it calls changeLanguage with "es"', async () => {
      render(<LanguageSwitcher />);

      // Open the dropdown by clicking the trigger button
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Select Español
      const espanolOption = screen.getByText('Español');
      await user.click(espanolOption);

      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });
  });

  describe('Given the user opens the language dropdown and selects English', () => {
    it('Then it calls changeLanguage with "en"', async () => {
      render(<LanguageSwitcher />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const englishOption = screen.getByText('English');
      await user.click(englishOption);

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });
  });
});
