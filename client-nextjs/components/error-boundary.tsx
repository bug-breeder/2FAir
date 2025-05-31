"use client";

import React from "react";
import { Button } from "@heroui/react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-content1 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-danger">
              Something went wrong
            </h2>
            <p className="mb-4 text-default-500">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-4">
              <Button
                color="primary"
                variant="flat"
                onPress={() => window.location.reload()}
              >
                Try again
              </Button>
              <Button
                color="default"
                variant="flat"
                onPress={() => window.location.href = "/"}
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 