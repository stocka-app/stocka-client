import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoubleRingSpinner } from '../DoubleRingSpinner';

describe('Given DoubleRingSpinner renders a loading indicator', () => {
  describe('When rendered with default props', () => {
    it('Then it renders a status role element with default Loading label', () => {
      render(<DoubleRingSpinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('Then it does not render a visible text label', () => {
      render(<DoubleRingSpinner />);
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });
  });

  describe('When a custom label is provided', () => {
    it('Then it uses the label as the aria-label', () => {
      render(<DoubleRingSpinner label="Fetching data" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Fetching data');
    });

    it('Then it renders the label as visible text', () => {
      render(<DoubleRingSpinner label="Fetching data" />);
      expect(screen.getByText('Fetching data')).toBeInTheDocument();
    });
  });

  describe('When elevated is true', () => {
    it('Then it renders the spinner inside a frosted-glass container', () => {
      const { container } = render(<DoubleRingSpinner elevated />);
      const elevatedWrapper = container.querySelector('.shadow-card');
      expect(elevatedWrapper).toBeInTheDocument();
    });
  });

  describe('When elevated is false (default)', () => {
    it('Then it renders the spinner without the frosted-glass container', () => {
      const { container } = render(<DoubleRingSpinner />);
      const elevatedWrapper = container.querySelector('.shadow-card');
      expect(elevatedWrapper).not.toBeInTheDocument();
    });
  });

  describe('When className is provided', () => {
    it('Then the className is applied to the root element', () => {
      render(<DoubleRingSpinner className="mt-8" />);
      expect(screen.getByRole('status')).toHaveClass('mt-8');
    });
  });
});
