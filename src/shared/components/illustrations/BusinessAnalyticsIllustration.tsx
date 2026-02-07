export function BusinessAnalyticsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 350 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="175" cy="140" r="120" fill="#EFF6FF" opacity="0.6" />
      
      {/* Main dashboard card */}
      <rect x="60" y="50" width="230" height="160" rx="12" fill="white" filter="drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))" />
      
      {/* Header bar */}
      <rect x="60" y="50" width="230" height="35" rx="12" fill="#2563EB" />
      <rect x="60" y="73" width="230" height="12" fill="#2563EB" />
      
      {/* Header dots */}
      <circle cx="78" cy="67" r="5" fill="#EF4444" />
      <circle cx="93" cy="67" r="5" fill="#F59E0B" />
      <circle cx="108" cy="67" r="5" fill="#10B981" />
      
      {/* Chart title placeholder */}
      <rect x="200" y="62" width="70" height="10" rx="5" fill="#93C5FD" />
      
      {/* Bar chart */}
      <rect x="80" y="170" width="25" height="25" rx="4" fill="#DBEAFE" />
      <rect x="80" y="150" width="25" height="45" rx="4" fill="#3B82F6" />
      
      <rect x="115" y="165" width="25" height="30" rx="4" fill="#DBEAFE" />
      <rect x="115" y="125" width="25" height="70" rx="4" fill="#60A5FA" />
      
      <rect x="150" y="160" width="25" height="35" rx="4" fill="#DBEAFE" />
      <rect x="150" y="110" width="25" height="85" rx="4" fill="#3B82F6" />
      
      <rect x="185" y="155" width="25" height="40" rx="4" fill="#DBEAFE" />
      <rect x="185" y="130" width="25" height="65" rx="4" fill="#60A5FA" />
      
      <rect x="220" y="145" width="25" height="50" rx="4" fill="#DBEAFE" />
      <rect x="220" y="100" width="25" height="95" rx="4" fill="#2563EB" />
      
      <rect x="255" y="140" width="25" height="55" rx="4" fill="#DBEAFE" />
      <rect x="255" y="95" width="25" height="100" rx="4" fill="#1D4ED8" />
      
      {/* Trend arrow */}
      <path d="M85 105 L265 75" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 4" />
      <polygon points="270,73 260,68 262,78" fill="#10B981" />
      
      {/* Floating card - Revenue */}
      <g transform="translate(20, 120)">
        <rect width="70" height="55" rx="10" fill="white" filter="drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1))" />
        <circle cx="20" cy="20" r="12" fill="#D1FAE5" />
        <path d="M16 20 L19 23 L25 17" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="10" y="38" width="35" height="6" rx="3" fill="#E5E7EB" />
        <rect x="50" y="38" width="12" height="6" rx="3" fill="#10B981" />
      </g>
      
      {/* Floating card - Growth */}
      <g transform="translate(260, 180)">
        <rect width="75" height="60" rx="10" fill="white" filter="drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1))" />
        <circle cx="22" cy="22" r="14" fill="#FEF3C7" />
        <path d="M22 28 L22 16 M17 21 L22 16 L27 21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="10" y="42" width="40" height="6" rx="3" fill="#E5E7EB" />
        <rect x="10" y="50" width="25" height="5" rx="2" fill="#FBBF24" />
      </g>
      
      {/* Pie chart floating element */}
      <g transform="translate(280, 30)">
        <rect width="55" height="55" rx="10" fill="white" filter="drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1))" />
        <circle cx="27.5" cy="27.5" r="18" fill="#DBEAFE" />
        <path d="M27.5 27.5 L27.5 9.5 A18 18 0 0 1 44 33 Z" fill="#3B82F6" />
        <path d="M27.5 27.5 L44 33 A18 18 0 0 1 20 44 Z" fill="#10B981" />
      </g>
      
      {/* Decorative elements */}
      <circle cx="40" cy="60" r="6" fill="#DBEAFE" />
      <circle cx="320" cy="140" r="8" fill="#FEF3C7" />
      <circle cx="50" cy="230" r="5" fill="#D1FAE5" />
      <circle cx="300" cy="260" r="7" fill="#E0E7FF" />
      
      {/* Small dots pattern */}
      <circle cx="15" cy="180" r="3" fill="#CBD5E1" />
      <circle cx="25" cy="190" r="2" fill="#CBD5E1" />
      <circle cx="340" cy="200" r="3" fill="#CBD5E1" />
      <circle cx="330" cy="220" r="2" fill="#CBD5E1" />
    </svg>
  )
}
