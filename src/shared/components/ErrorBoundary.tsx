
import { Component } from 'react';
import type { ReactNode } from 'react';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';
import { Button } from './ui/button';

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(/* error: Error, errorInfo: React.ErrorInfo */) {
    // Aquí podrías loguear el error a un servicio externo
  }

  handleReload = () => {
    globalThis.location.reload();
  };

  handleGoHome = () => {
    globalThis.location.assign('/');
  };

  render() {
    const { hasError } = this.state;
    const { t, children } = this.props;
    if (hasError) {
      return (
        <div role="alert" className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('errorBoundary.title')}</h1>
          <p className="mb-6 text-muted-foreground">{t('errorBoundary.description')}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={this.handleReload}>{t('errorBoundary.reload')}</Button>
            <Button variant="secondary" onClick={this.handleGoHome}>{t('errorBoundary.goHome')}</Button>
          </div>
        </div>
      );
    }
    return children;
  }
}

const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
export default ErrorBoundary;
