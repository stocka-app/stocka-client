import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

// eslint-disable-next-line react-refresh/only-export-components -- helper utility tightly coupled to AvatarWithFallback; kept in the same file for discoverability.
export function getInitials(
  givenName: string | null | undefined,
  familyName: string | null | undefined,
  displayName: string | null | undefined,
  username: string,
): string {
  if (givenName && familyName) return (givenName[0] + familyName[0]).toUpperCase();
  if (givenName) return givenName.slice(0, 2).toUpperCase();
  if (displayName) {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 4) return (parts[0][0] + parts[2][0]).toUpperCase();
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function AvatarWithFallback({
  avatarUrl,
  initials,
  className,
}: {
  avatarUrl: string | null | undefined;
  initials: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        referrerPolicy="no-referrer"
        className={cn('rounded-full object-cover', className)}
        onError={() => setImgError(true)}
      />
    );
  }
  return <span>{initials}</span>;
}
