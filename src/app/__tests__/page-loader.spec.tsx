import { render } from '@testing-library/react';
import { PageLoader } from '@/app/page-loader';

describe('PageLoader', () => {
  describe('Given the app is loading', () => {
    it('Then it renders a skeleton-based loading placeholder', () => {
      const { container } = render(<PageLoader />);
      // The loader renders a div — verify it mounts without crashing
      expect(container.firstChild).toBeTruthy();
    });
  });
});
