import { RouterProvider } from 'react-router-dom';
import { router } from './router';

// Import i18n configuration
import '@/shared/lib/i18n';

interface ProvidersProps {
  children?: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <RouterProvider router={router} />
      {children}
    </>
  );
}
