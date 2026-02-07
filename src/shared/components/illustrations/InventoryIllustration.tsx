export function InventoryIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background shapes */}
      <ellipse cx="200" cy="280" rx="150" ry="20" fill="#E0E7FF" opacity="0.5" />
      
      {/* Warehouse/Shelf structure */}
      <rect x="80" y="100" width="240" height="160" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
      
      {/* Shelf lines */}
      <line x1="80" y1="150" x2="320" y2="150" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="80" y1="200" x2="320" y2="200" stroke="#CBD5E1" strokeWidth="2" />
      
      {/* Box 1 - Blue */}
      <rect x="95" y="110" width="50" height="35" rx="4" fill="#3B82F6" />
      <rect x="105" y="118" width="30" height="4" rx="2" fill="#93C5FD" />
      <rect x="105" y="126" width="20" height="4" rx="2" fill="#93C5FD" />
      
      {/* Box 2 - Amber */}
      <rect x="155" y="115" width="45" height="30" rx="4" fill="#F59E0B" />
      <rect x="165" y="122" width="25" height="4" rx="2" fill="#FCD34D" />
      <rect x="165" y="129" width="15" height="4" rx="2" fill="#FCD34D" />
      
      {/* Box 3 - Green */}
      <rect x="210" y="108" width="55" height="38" rx="4" fill="#10B981" />
      <rect x="222" y="116" width="31" height="4" rx="2" fill="#6EE7B7" />
      <rect x="222" y="124" width="21" height="4" rx="2" fill="#6EE7B7" />
      
      {/* Box 4 - Blue light */}
      <rect x="275" y="112" width="35" height="33" rx="4" fill="#60A5FA" />
      <rect x="282" y="119" width="21" height="4" rx="2" fill="#BFDBFE" />
      
      {/* Second shelf boxes */}
      <rect x="100" y="158" width="60" height="35" rx="4" fill="#2563EB" />
      <rect x="112" y="166" width="36" height="4" rx="2" fill="#93C5FD" />
      <rect x="112" y="174" width="24" height="4" rx="2" fill="#93C5FD" />
      
      <rect x="175" y="162" width="40" height="30" rx="4" fill="#FBBF24" />
      <rect x="183" y="169" width="24" height="4" rx="2" fill="#FEF3C7" />
      
      <rect x="230" y="155" width="70" height="40" rx="4" fill="#34D399" />
      <rect x="245" y="165" width="40" height="4" rx="2" fill="#A7F3D0" />
      <rect x="245" y="173" width="28" height="4" rx="2" fill="#A7F3D0" />
      
      {/* Third shelf boxes */}
      <rect x="90" y="210" width="55" height="40" rx="4" fill="#818CF8" />
      <rect x="102" y="220" width="31" height="4" rx="2" fill="#C7D2FE" />
      <rect x="102" y="228" width="21" height="4" rx="2" fill="#C7D2FE" />
      
      <rect x="160" y="215" width="48" height="32" rx="4" fill="#FB923C" />
      <rect x="170" y="223" width="28" height="4" rx="2" fill="#FED7AA" />
      
      <rect x="225" y="208" width="80" height="45" rx="4" fill="#38BDF8" />
      <rect x="242" y="218" width="46" height="4" rx="2" fill="#BAE6FD" />
      <rect x="242" y="226" width="32" height="4" rx="2" fill="#BAE6FD" />
      <rect x="242" y="234" width="20" height="4" rx="2" fill="#BAE6FD" />
      
      {/* Clipboard */}
      <rect x="40" y="140" width="30" height="45" rx="4" fill="#1E40AF" />
      <rect x="48" y="135" width="14" height="8" rx="2" fill="#3B82F6" />
      <rect x="46" y="150" width="18" height="3" rx="1" fill="#93C5FD" />
      <rect x="46" y="156" width="18" height="3" rx="1" fill="#93C5FD" />
      <rect x="46" y="162" width="18" height="3" rx="1" fill="#93C5FD" />
      <rect x="46" y="168" width="12" height="3" rx="1" fill="#93C5FD" />
      <circle cx="51" cy="176" r="4" fill="#10B981" />
      
      {/* Chart/Analytics floating element */}
      <g transform="translate(330, 60)">
        <rect width="50" height="50" rx="8" fill="white" filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" />
        <rect x="10" y="35" width="8" height="8" rx="2" fill="#3B82F6" />
        <rect x="21" y="25" width="8" height="18" rx="2" fill="#10B981" />
        <rect x="32" y="15" width="8" height="28" rx="2" fill="#F59E0B" />
      </g>
      
      {/* Package icon floating */}
      <g transform="translate(20, 60)">
        <rect width="45" height="45" rx="8" fill="white" filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" />
        <rect x="10" y="12" width="25" height="22" rx="3" fill="#3B82F6" />
        <line x1="22.5" y1="12" x2="22.5" y2="34" stroke="#1E40AF" strokeWidth="2" />
        <line x1="10" y1="20" x2="35" y2="20" stroke="#1E40AF" strokeWidth="2" />
      </g>
      
      {/* Decorative circles */}
      <circle cx="350" cy="200" r="8" fill="#DBEAFE" />
      <circle cx="370" cy="180" r="5" fill="#FEF3C7" />
      <circle cx="30" cy="220" r="6" fill="#D1FAE5" />
      <circle cx="50" cy="240" r="4" fill="#DBEAFE" />
    </svg>
  )
}
