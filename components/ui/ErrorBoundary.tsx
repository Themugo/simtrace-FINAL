import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2.5rem 1.5rem',
            margin: '2rem auto',
            maxWidth: '600px',
            background: 'rgba(244, 63, 94, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '16px',
            textAlign: 'center',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 1rem auto',
              background: 'rgba(244, 63, 94, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rose, #f43f5e)',
            }}
          >
            <AlertTriangle size={24} />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            Something went wrong
          </h2>

          <p style={{ fontSize: '0.875rem', color: 'var(--text2)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <a
              href="/"
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              <Home size={16} /> Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
