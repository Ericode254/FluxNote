import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isBlockNoteError = this.state.error?.message?.includes("bnBlock") || 
                              this.state.error?.message?.includes("blockContainer");

      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#221D13]">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#201C16] dark:text-[#EDE6D3]">Something went wrong</h2>
          <p className="text-sm text-[#6B6455] dark:text-[#93876A] mb-6 max-w-md">
            {isBlockNoteError 
              ? "This document appears to have an incompatible structure. This can happen if the document was initialized with an incorrect format."
              : this.state.error?.message || "An unexpected error occurred while loading the editor."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#F6F1E7] dark:bg-[#3A3323] text-[#201C16] dark:text-[#EDE6D3] rounded-lg font-medium transition-colors hover:bg-[#EAE0C8] dark:hover:bg-[#4A4530]"
            >
              Reload Page
            </button>
            {isBlockNoteError && (
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                Reset Document
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
