/**
 * ErrorBoundary Component
 * Error handling wrapper for components
 */

import React from "react";

import { getErrorMessage } from "@/lib/api";
import { FriendlyErrorState } from "./FriendlyErrorState";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <FriendlyErrorState
            title="Something went wrong"
            description={getErrorMessage(this.state.error)}
            helperText="Your session and data are safe. Please try again or refresh the page if the issue continues."
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        )
      );
    }

    return this.props.children;
  }
}
