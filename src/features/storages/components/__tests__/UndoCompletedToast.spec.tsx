import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { showUndoCompletedToast } from '@/features/storages/components/UndoCompletedToast';

const { mockToastCustom } = vi.hoisted(() => ({
  mockToastCustom: vi.fn<(render: () => React.ReactElement, opts?: unknown) => void>(),
}));

vi.mock('sonner', () => ({
  toast: { custom: mockToastCustom },
}));

vi.mock('@/shared/lib/i18n', () => ({
  default: {
    getFixedT: () => (key: string, opts?: { defaultValue?: string; name?: string }) => {
      const base = opts?.defaultValue ?? key;
      return opts?.name ? base.replace('{{name}}', opts.name) : base;
    },
  },
}));

describe('showUndoCompletedToast', () => {
  describe('Given the helper is invoked for a restored archive', () => {
    describe('When toast.custom is called', () => {
      it('Then it uses the 2 second duration and renders "fue restaurada"', () => {
        showUndoCompletedToast({ storageName: 'WH Sur', action: 'archive' });

        const renderFn = mockToastCustom.mock.calls.at(-1)?.[0];
        const opts = mockToastCustom.mock.calls.at(-1)?.[1] as { duration: number };
        expect(opts.duration).toBe(2000);
        if (renderFn === undefined) throw new Error('expected toast.custom render fn');

        render(renderFn());
        expect(screen.getByText(/WH Sur/)).toBeInTheDocument();
        expect(screen.getByText(/fue restaurada/)).toBeInTheDocument();
      });
    });
  });

  describe('Given the helper is invoked for a reactivated freeze', () => {
    describe('When the rendered content is inspected', () => {
      it('Then the title reads "fue reactivada"', () => {
        showUndoCompletedToast({ storageName: 'SR Norte', action: 'freeze' });
        const renderFn = mockToastCustom.mock.calls.at(-1)?.[0];
        if (renderFn === undefined) throw new Error('expected toast.custom render fn');
        render(renderFn());
        expect(screen.getByText(/SR Norte/)).toBeInTheDocument();
        expect(screen.getByText(/fue reactivada/)).toBeInTheDocument();
      });
    });
  });
});
