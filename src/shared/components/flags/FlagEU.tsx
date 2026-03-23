export function FlagEU(props: React.SVGAttributes<SVGSVGElement>): React.ReactElement {
  return (
    <svg
      viewBox="0 0 810 540"
      aria-hidden="true"
      {...props}
    >
      <rect width="810" height="540" fill="#003399" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const cx = 405 + 140 * Math.cos(angle);
        const cy = 270 + 140 * Math.sin(angle);
        return (
          <polygon
            key={i}
            points={[...Array(5)].map((__, j) => {
              const a = ((j * 144 - 90) * Math.PI) / 180;
              return `${cx + 20 * Math.cos(a)},${cy + 20 * Math.sin(a)}`;
            }).join(' ')}
            fill="#FFCC00"
          />
        );
      })}
    </svg>
  );
}
