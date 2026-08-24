"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled UI error", { error, componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-bold text-(--color-primary)">
            Something went wrong
          </h1>
          <p className="mt-3 text-(--color-text-muted)">
            Please try again. If the problem continues, refresh the page or contact the Go Nurture team.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-5 py-3 text-white hover:bg-(--color-primary)/90"
          >
            <RefreshCw size={18} />
            Try again
          </button>
        </div>
      </main>
    );
  }
}
