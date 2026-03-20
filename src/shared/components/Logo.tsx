import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  /** Si es true, el logo no será clickeable */
  disableLink?: boolean;
}

const sizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Logo({ className, size = 'md', showIcon = true, disableLink = false }: LogoProps) {
  const { isAuthenticated } = useAuthenticationStore();

  // Determinar destino según estado de autenticación
  const destination = isAuthenticated ? '/dashboard' : '/authentication/sign-in';

  const logoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <Package className={cn('text-primary', iconSizes[size])} />}
      <span className={cn('font-bold text-primary', sizes[size])}>Stocka</span>
    </div>
  );

  if (disableLink) {
    return logoContent;
  }

  return (
    <Link to={destination} className="transition-opacity hover:opacity-80">
      {logoContent}
    </Link>
  );
}
