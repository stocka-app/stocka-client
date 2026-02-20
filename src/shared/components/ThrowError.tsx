import React from 'react';

// Este componente lanza un error al montarse para probar el ErrorBoundary
export function ThrowError() {
  React.useEffect(() => {
    throw new Error('Test error for ErrorBoundary');
  }, []);
  return null;
}
