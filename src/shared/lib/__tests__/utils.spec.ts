import { cn } from '@/shared/lib/utils';

describe('cn() utility — Tailwind class merging', () => {
  describe('Given no arguments', () => {
    it('Then it returns an empty string', () => {
      expect(cn()).toBe('');
    });
  });

  describe('Given a single class string', () => {
    it('Then it returns that class unchanged', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });
  });

  describe('Given multiple class strings', () => {
    it('Then it merges all classes into a single string', () => {
      expect(cn('text-red-500', 'bg-blue-100', 'p-4')).toBe('text-red-500 bg-blue-100 p-4');
    });
  });

  describe('Given falsy values mixed with valid classes', () => {
    it('Then it ignores undefined values', () => {
      expect(cn('text-sm', undefined, 'font-bold')).toBe('text-sm font-bold');
    });

    it('Then it ignores false values', () => {
      expect(cn('text-sm', false, 'font-bold')).toBe('text-sm font-bold');
    });

    it('Then it ignores null values', () => {
      expect(cn('text-sm', null, 'font-bold')).toBe('text-sm font-bold');
    });

    it('Then it returns an empty string when all values are falsy', () => {
      expect(cn(undefined, false, null)).toBe('');
    });
  });

  describe('Given conflicting Tailwind utility classes', () => {
    it('Then the last padding class wins', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('Then the last text color class wins', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('Then the last background color class wins', () => {
      expect(cn('bg-white', 'bg-gray-100', 'bg-slate-900')).toBe('bg-slate-900');
    });
  });

  describe('Given an object with conditional class entries', () => {
    it('Then it includes only the classes whose value is truthy', () => {
      expect(cn({ 'text-bold': true, 'text-italic': false, 'underline': true })).toBe(
        'text-bold underline',
      );
    });

    it('Then it returns empty string when all entries are falsy', () => {
      expect(cn({ 'text-bold': false, 'text-italic': false })).toBe('');
    });
  });

  describe('Given a mix of strings, objects, and falsy values', () => {
    it('Then it correctly merges all inputs and resolves conflicts', () => {
      expect(cn('px-2', { 'px-4': true, 'opacity-50': false }, 'font-bold')).toBe(
        'px-4 font-bold',
      );
    });
  });
});
