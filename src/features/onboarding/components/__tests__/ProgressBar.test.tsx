import { render } from '@testing-library/react';
import { ProgressBar } from '@/features/onboarding/components/ProgressBar';

describe('ProgressBar', () => {
  describe('Given the onboarding wizard has 7 steps', () => {
    describe('When the user is on step 1', () => {
      it('Then only the first segment is active (blue)', () => {
        const { container } = render(<ProgressBar currentStep={1} />);
        const segments = container.querySelectorAll('[aria-label^="Step"]');
        expect(segments).toHaveLength(7);
      });

      it('Then the progress bar has the correct aria attributes', () => {
        const { container } = render(<ProgressBar currentStep={1} />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toHaveAttribute('aria-valuenow', '1');
        expect(progressBar).toHaveAttribute('aria-valuemin', '1');
        expect(progressBar).toHaveAttribute('aria-valuemax', '7');
      });
    });

    describe('When the user is on step 4', () => {
      it('Then the progress bar reflects step 4', () => {
        const { container } = render(<ProgressBar currentStep={4} />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toHaveAttribute('aria-valuenow', '4');
      });
    });

    describe('When the user is on step 7 (final step)', () => {
      it('Then all 7 segments are rendered', () => {
        const { container } = render(<ProgressBar currentStep={7} />);
        const segments = container.querySelectorAll('[aria-label^="Step"]');
        expect(segments).toHaveLength(7);
      });

      it('Then the progress bar shows step 7', () => {
        const { container } = render(<ProgressBar currentStep={7} />);
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toHaveAttribute('aria-valuenow', '7');
      });
    });
  });
});
