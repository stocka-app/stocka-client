import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Dialog from '@/shared/components/Dialog';

describe('Dialog', () => {
  describe('Given the dialog is closed', () => {
    it('Then nothing is rendered', () => {
      render(
        <Dialog open={false} onClose={vi.fn()}>
          <p>hidden</p>
        </Dialog>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Given the dialog is opened with default props', () => {
    it('Then it renders with the closable default and shows children', () => {
      render(
        <Dialog open={true} onClose={vi.fn()}>
          <p>hello</p>
        </Dialog>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('hello')).toBeInTheDocument();
    });
  });

  describe('Given the dialog has an ariaLabelledBy id', () => {
    it('Then it sets aria-labelledby on the dialog element', () => {
      render(
        <Dialog open={true} onClose={vi.fn()} ariaLabelledBy="dlg-title">
          <h2 id="dlg-title">Title</h2>
        </Dialog>,
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'dlg-title');
    });
  });
});
