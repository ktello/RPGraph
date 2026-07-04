import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  label: string;
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <h3>⚠ {this.props.label} — Render Error</h3>
            <p>{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
            >
              Try to Recover
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
