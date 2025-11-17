import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

/**
 * Global ErrorBoundary to prevent full white screen crashes.
 * Catches render/runtime errors in descendant components and shows a
 * friendly recovery UI with a reload button and optional diagnostics toggle.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Dispatch a toast so existing notification system can surface it.
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { type: 'danger', title: 'Unexpected Error', message: error.message }
    }));
    // Optionally we could send this to analytics / logging service.
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    // Clear potential transient state and reload.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '2rem' }}>
        <div className="card shadow-sm border-0" style={{ maxWidth: 560, width: '100%' }}>
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0"><i className="bi bi-exclamation-triangle-fill me-2" />{this.props.fallbackTitle || 'Application Error'}</h5>
          </div>
          <div className="card-body">
            <p>Something went wrong while rendering the application. You can try reloading. If the problem persists, contact support.</p>
            {this.state.error && (
              <details className="small text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                <summary className="mb-2">Technical details</summary>
                {this.state.error.toString()}
              </details>
            )}
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-danger" onClick={this.handleReload}>
                <i className="bi bi-arrow-clockwise me-1" />Reload App
              </button>
              <button className="btn btn-outline-secondary" onClick={()=>this.setState({ hasError: false, error: undefined })}>
                <i className="bi bi-x-circle me-1" />Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
