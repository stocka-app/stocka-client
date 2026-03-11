import { cn } from '@/shared/lib/utils';

interface IsometricCubesIllustrationProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function IsometricCubesIllustration({
  className,
  variant = 'light',
}: IsometricCubesIllustrationProps) {
  const isLight = variant === 'light';

  // Light: teal on mint/white; Dark: teal-glow on slate
  const stroke1 = isLight ? '#00796B' : '#2dd4bf';
  const stroke2 = isLight ? '#00695C' : '#5eead4';
  const stroke3 = isLight ? '#004D40' : '#115e59';
  const fillA = isLight ? '#E0F2F1' : '#334155';
  const fillB = isLight ? '#B2DFDB' : '#475569';
  const fillC = isLight ? '#80CBC4' : '#0f172a';
  const fillTop = isLight ? '#ffffff' : '#0f172a';
  const accentFill = isLight ? '#00897B' : '#2dd4bf';
  const gridOpacity = isLight ? 0.1 : 0.05;
  const gridColor = isLight ? '#4DB6AC' : '#2dd4bf';

  return (
    <svg
      className={cn('h-full w-full', isLight ? 'opacity-60 mix-blend-multiply' : 'opacity-80', className)}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="auth-grid" patternUnits="userSpaceOnUse" width="40" height="40">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
        {!isLight && (
          <filter id="auth-glow">
            <feGaussianBlur result="coloredBlur" stdDeviation="2" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <rect
        fill="url(#auth-grid)"
        height="100%"
        width="100%"
        style={{ color: gridColor, opacity: gridOpacity }}
      />

      <g transform="translate(400, 500) scale(1.2)">
        {/* Small cube top-left */}
        <path d="M-220 -180 L-180 -200 L-140 -180 L-180 -160 Z" fill={fillA} opacity="0.4" stroke={stroke1} strokeWidth="1" />
        <path d="M-220 -180 L-220 -100 L-180 -80 L-180 -160 Z" fill="none" stroke={stroke1} strokeWidth="1" />
        <path d="M-140 -180 L-140 -100 L-180 -80 Z" fill={fillC} opacity="0.2" />

        {/* Small cube top-right */}
        <path d="M180 -220 L220 -200 L220 -120 L180 -140 Z" fill="none" stroke={stroke1} strokeWidth="1" />
        <path d="M180 -220 L140 -200 L140 -120 L180 -140 Z" fill={fillA} opacity={isLight ? '0.3' : '0.4'} />
        <path d="M180 -140 L220 -120 L180 -100 L140 -120 Z" fill="none" stroke={stroke1} strokeWidth="1" />

        {/* Main tall cube */}
        <path d="M0 -300 L60 -270 L60 100 L0 70 Z" fill={fillA} opacity="0.8" stroke={stroke2} strokeWidth="1.5" />
        <path d="M0 -300 L-60 -270 L-60 100 L0 70 Z" fill={fillB} opacity="0.6" stroke={stroke2} strokeWidth="1.5" />
        <path d="M0 -300 L60 -270 L0 -240 L-60 -270 Z" fill={fillTop} stroke={stroke2} strokeWidth="1.5" />
        <path d="M0 -240 L0 70" stroke={stroke2} strokeWidth="1" />
        <path d="M-60 -200 L0 -170 L60 -200" fill="none" opacity="0.5" stroke={stroke2} strokeWidth="1" />
        <path d="M-60 -130 L0 -100 L60 -130" fill="none" opacity="0.5" stroke={stroke2} strokeWidth="1" />
        <path d="M-60 -60 L0 -30 L60 -60" fill="none" opacity="0.5" stroke={stroke2} strokeWidth="1" />

        {/* Left cube */}
        <path d="M-60 100 L-180 40 L-180 -40 L-60 20 Z" fill={fillA} opacity="0.9" stroke={stroke2} strokeWidth="1.5" />
        <path d="M-60 20 L0 50 L0 70 L-60 100 Z" fill={fillB} opacity="0.4" />
        <path d="M-180 -40 L-120 -70 L0 -10 L-60 20 Z" fill={fillTop} stroke={stroke2} strokeWidth="1.5" />
        <path d="M-140 -60 L-80 -30" fill="none" stroke={stroke1} strokeWidth="1" />
        <path d="M-100 -80 L-40 -50" fill="none" stroke={stroke1} strokeWidth="1" />

        {/* Right cube */}
        <path d="M60 100 L160 50 L160 -50 L60 0 Z" fill={fillB} opacity="0.7" stroke={stroke2} strokeWidth="1.5" />
        <path d="M60 0 L160 -50 L100 -80 L0 -30 Z" fill={fillTop} stroke={stroke2} strokeWidth="1.5" />
        <path d="M80 90 L80 -10" fill="none" stroke={stroke1} strokeDasharray="4 4" strokeWidth="0.5" />
        <path d="M120 70 L120 -30" fill="none" stroke={stroke1} strokeDasharray="4 4" strokeWidth="0.5" />

        {/* Connector lines */}
        <path d="M-180 40 L-260 0" stroke={stroke3} strokeWidth="2" />
        <path d="M160 50 L240 10" stroke={stroke3} strokeWidth="2" />
        <path d="M0 70 L0 150" stroke={stroke3} strokeWidth="2" />

        {/* Accent cubes */}
        <rect
          fill={accentFill}
          height="15"
          width="15"
          x="-180"
          y="-180"
          transform="matrix(0.866 0.5 -0.866 0.5 0 0)"
          {...(!isLight && { filter: 'url(#auth-glow)' })}
        />
        <rect
          fill={accentFill}
          height="12"
          width="12"
          x="140"
          y="-200"
          transform="matrix(0.866 0.5 -0.866 0.5 0 0)"
          {...(!isLight && { filter: 'url(#auth-glow)' })}
        />
        <rect
          fill={accentFill}
          height="10"
          width="10"
          x="-80"
          y="20"
          transform="matrix(0.866 0.5 -0.866 0.5 0 0)"
          {...(!isLight && { filter: 'url(#auth-glow)' })}
        />

        {/* Dashed orbital circles */}
        <circle cx="0" cy="-50" r="280" fill="none" opacity={isLight ? '0.2' : '0.3'} stroke={stroke1} strokeDasharray="10 10" strokeWidth="1" />
        <circle cx="0" cy="-50" r="340" fill="none" opacity="0.1" stroke={stroke1} strokeWidth="1" />
      </g>
    </svg>
  );
}
