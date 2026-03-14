import { render } from '@testing-library/react';
import { Spinner } from '@/shared/components/Spinner';

describe('Spinner', () => {
  describe('Given no size prop is provided', () => {
    it('Then it renders with the default medium size class', () => {
      const { container } = render(<Spinner />);
      const icon = container.querySelector('svg');
      expect(icon).toBeTruthy();
      expect(icon?.classList.contains('h-6')).toBe(true);
      expect(icon?.classList.contains('w-6')).toBe(true);
    });
  });

  describe('Given size="sm" is provided', () => {
    it('Then it renders with small size classes', () => {
      const { container } = render(<Spinner size="sm" />);
      const icon = container.querySelector('svg');
      expect(icon?.classList.contains('h-4')).toBe(true);
      expect(icon?.classList.contains('w-4')).toBe(true);
    });
  });

  describe('Given size="lg" is provided', () => {
    it('Then it renders with large size classes', () => {
      const { container } = render(<Spinner size="lg" />);
      const icon = container.querySelector('svg');
      expect(icon?.classList.contains('h-8')).toBe(true);
      expect(icon?.classList.contains('w-8')).toBe(true);
    });
  });

  describe('Given a custom className is provided', () => {
    it('Then it includes the custom class on the icon', () => {
      const { container } = render(<Spinner className="text-red-500" />);
      const icon = container.querySelector('svg');
      expect(icon?.classList.contains('text-red-500')).toBe(true);
    });
  });

  describe('Given the spinner renders', () => {
    it('Then it always includes the animate-spin class', () => {
      const { container } = render(<Spinner />);
      const icon = container.querySelector('svg');
      expect(icon?.classList.contains('animate-spin')).toBe(true);
    });
  });
});
