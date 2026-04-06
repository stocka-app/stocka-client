import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Drawer from '../Drawer';

describe('Given the Drawer shell component', () => {
  describe('When rendered in the closed state', () => {
    it('Then the panel is hidden from assistive technology', () => {
      render(
        <Drawer open={false} onClose={vi.fn()}>
          <p>drawer content</p>
        </Drawer>,
      );
      const panel = screen.getByText('drawer content').parentElement;
      expect(panel).toHaveAttribute('aria-hidden', 'true');
    });

    it('Then the children are still mounted in the DOM', () => {
      render(
        <Drawer open={false} onClose={vi.fn()}>
          <p>drawer content</p>
        </Drawer>,
      );
      expect(screen.getByText('drawer content')).toBeInTheDocument();
    });
  });

  describe('When rendered in the open state', () => {
    it('Then the panel is visible to assistive technology', () => {
      render(
        <Drawer open onClose={vi.fn()}>
          <p>drawer content</p>
        </Drawer>,
      );
      const panel = screen.getByText('drawer content').parentElement;
      expect(panel).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('When the user clicks the backdrop', () => {
    it('Then onClose is called', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Drawer open onClose={onClose}>
          <p>drawer content</p>
        </Drawer>,
      );
      const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
