import { DoubleRingSpinner } from '@/shared/components/DoubleRingSpinner';

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <DoubleRingSpinner />
    </div>
  );
}
