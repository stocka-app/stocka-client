import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { showUndoToast } from '@/features/storages/components/UndoToast';

const { mockToastCustom, mockToastDismiss } = vi.hoisted(() => ({
  mockToastCustom: vi.fn<(render: (id: string | number) => React.ReactElement, opts?: unknown) => void>(),
  mockToastDismiss: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { custom: mockToastCustom, dismiss: mockToastDismiss },
}));

vi.mock('@/shared/lib/i18n', () => ({
  default: {
    getFixedT: () => (key: string, opts?: { defaultValue?: string; name?: string }) => {
      const base = opts?.defaultValue ?? key;
      return opts?.name ? base.replace('{{name}}', opts.name) : base;
    },
  },
}));

describe('showUndoToast', () => {
  describe('Given the helper is invoked for an archive action', () => {
    describe('When toast.custom is called', () => {
      it('Then the rendered content shows the archived title with the storage name', () => {
        const onUndo = vi.fn();
        showUndoToast({ storageName: 'WH Norte', action: 'archive', onUndo });

        expect(mockToastCustom).toHaveBeenCalledTimes(1);
        const renderFn = mockToastCustom.mock.calls[0][0];
        const opts = mockToastCustom.mock.calls[0][1] as { duration: number };
        expect(opts.duration).toBe(6000);

        render(renderFn('toast-1'));
        expect(screen.getByText(/WH Norte/)).toBeInTheDocument();
        expect(screen.getByText(/fue archivada/)).toBeInTheDocument();
      });
    });
  });

  describe('Given the helper is invoked for a freeze action', () => {
    describe('When the rendered content is inspected', () => {
      it('Then the title reads "fue congelada"', () => {
        const onUndo = vi.fn();
        showUndoToast({ storageName: 'SR Sur', action: 'freeze', onUndo });
        const renderFn = mockToastCustom.mock.calls.at(-1)?.[0];
        if (renderFn === undefined) throw new Error('expected toast.custom render fn');
        render(renderFn('toast-2'));
        expect(screen.getByText(/SR Sur/)).toBeInTheDocument();
        expect(screen.getByText(/fue congelada/)).toBeInTheDocument();
      });
    });
  });

  describe('Given the rendered toast is on screen', () => {
    describe('When the user clicks the Undo button', () => {
      it('Then onUndo is called and the toast id is dismissed', async () => {
        const user = userEvent.setup();
        const onUndo = vi.fn();
        showUndoToast({ storageName: 'CR Centro', action: 'archive', onUndo });
        const renderFn = mockToastCustom.mock.calls.at(-1)?.[0];
        if (renderFn === undefined) throw new Error('expected toast.custom render fn');
        render(renderFn('toast-99'));

        await user.click(screen.getByRole('button', { name: /Deshacer/ }));
        expect(onUndo).toHaveBeenCalledTimes(1);
        expect(mockToastDismiss).toHaveBeenCalledWith('toast-99');
      });
    });
  });
});
