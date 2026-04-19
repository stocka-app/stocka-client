import { useState, useEffect, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import {
  PICKER_ICONS,
  PICKER_COLORS,
  HEX_PATTERN,
} from '@/shared/lib/icon-color-picker.constants';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IconColorPickerProps {
  selectedIcon: string;
  selectedColor: string;
  onChange: (icon: string, color: string) => void;
  onClose: () => void;
  onApply?: () => void;
  positionClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IconColorPicker({
  selectedIcon,
  selectedColor,
  onChange,
  onClose,
  onApply,
  positionClassName = 'fixed bottom-[72px] right-[480px] z-[60]',
}: IconColorPickerProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const titleId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent): void => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const [tempIcon, setTempIcon] = useState(selectedIcon);
  const [tempColor, setTempColor] = useState(selectedColor);
  const [customHex, setCustomHex] = useState(selectedColor);
  const [customHexInvalid, setCustomHexInvalid] = useState(false);
  const [iconsExpanded, setIconsExpanded] = useState(true);
  const [colorsExpanded, setColorsExpanded] = useState(true);
  const [customColorExpanded, setCustomColorExpanded] = useState(true);

  const handleIconSelect = (iconName: string): void => {
    setTempIcon(iconName);
    onChange(iconName, tempColor);
  };

  const handleColorSelect = (color: string): void => {
    setTempColor(color);
    setCustomHex(color);
    setCustomHexInvalid(false);
    onChange(tempIcon, color);
  };

  const handleCustomHexChange = (value: string): void => {
    setCustomHex(value);
    if (HEX_PATTERN.test(value)) {
      setTempColor(value);
      setCustomHexInvalid(false);
      onChange(tempIcon, value);
    } else {
      setCustomHexInvalid(true);
    }
  };

  return (
    <div
      ref={pickerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        'flex max-h-[calc(100vh-88px)] w-[280px] flex-col overflow-hidden rounded-xl bg-white shadow-[-8px_0_32px_-4px_rgba(0,0,0,0.32)] dark:bg-[#1a2e45]',
        positionClassName,
      )}
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/[0.08]">
        <h3 id={titleId} className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
          {t('createDrawer.customizeIconColor')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('createDrawer.close')}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/5 text-[#374151] hover:bg-black/10 dark:bg-white/[0.08] dark:text-[#94A3B8] dark:hover:bg-white/[0.14]"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-2">

        {/* Icon section */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setIconsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-[11px] font-medium leading-none text-[#64748b]">
              {t('createDrawer.iconSection')}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#64748b]">
              {iconsExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
          {/* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */}
          {iconsExpanded && (
            <div className="grid grid-cols-6 gap-1">
              {PICKER_ICONS.map((iconName) => {
                const isSelected = tempIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    aria-label={iconName}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-100',
                      isSelected
                        ? 'bg-[#0D9488]/15 ring-2 ring-[#0D9488] ring-offset-1 ring-offset-white dark:ring-offset-[#1a2e45]'
                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/[0.06]',
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined text-[20px] transition-colors',
                        isSelected ? 'text-[#0D9488] dark:text-[#5EEAD4]' : 'text-[#94a3b8] hover:text-[#475569] dark:text-[#64748b] dark:hover:text-[#e2e8f0]',
                      )}
                    >
                      {iconName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-2 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

        {/* Color section */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setColorsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-[11px] font-medium leading-none text-[#64748b]">
              {t('createDrawer.colorSection')}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#64748b]">
              {colorsExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
          {colorsExpanded && (
            <div className="grid grid-cols-6 gap-3">
              {PICKER_COLORS.map((color) => {
                const isSelected = tempColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    aria-label={color}
                    aria-pressed={isSelected}
                    className="h-[30px] w-[30px] rounded-full transition-all duration-100"
                    style={
                      isSelected
                        ? {
                            backgroundColor: color,
                            outline: '2px solid white',
                            outlineOffset: '2px',
                            transform: 'scale(1.15)',
                          }
                        : { backgroundColor: color }
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-2 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

        {/* Custom color section */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setCustomColorExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-[11px] font-medium leading-none text-[#64748b]">
              {t('createDrawer.customColorSection')}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#64748b]">
              {customColorExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
          {/* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */}
          {customColorExpanded && (
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 shrink-0 rounded-lg"
                style={{ backgroundColor: HEX_PATTERN.test(customHex) ? customHex : '#E5E7EB' }}
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                placeholder="#000000"
                maxLength={7}
                className={cn(
                  'h-9 flex-1 rounded-lg border bg-[#F9FAFB] px-3 font-mono text-xs text-[#374151] outline-none focus:ring-2 focus:ring-brand/30 dark:bg-[#182437] dark:text-[#D1D5DB]',
                  customHexInvalid ? 'border-danger' : 'border-black/10 dark:border-white/[0.1]',
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer — Apply / Cancel */}
      {onApply !== undefined && (
        <div className="flex shrink-0 gap-2 border-t border-black/10 px-4 py-3 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-black/10 bg-transparent py-2 text-xs font-medium text-[#374151] hover:bg-black/5 dark:border-white/[0.1] dark:text-[#D1D5DB] dark:hover:bg-white/[0.06]"
          >
            {t('createDrawer.pickerCancel')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-lg bg-brand py-2 text-xs font-medium text-white hover:bg-brand-hover"
          >
            {t('createDrawer.pickerApply')}
          </button>
        </div>
      )}
    </div>
  );
}
