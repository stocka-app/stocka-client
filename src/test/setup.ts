import '@testing-library/jest-dom';

// Radix UI components (Checkbox, etc.) rely on ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
