import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-2xl text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tight mb-4 text-foreground">Something went wrong</h1>
            
            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
              We encountered an unexpected error while rendering this page. Our team has been notified.
            </p>

            <div className="bg-muted/30 rounded-2xl p-4 mb-8 text-left overflow-auto max-h-32">
              <p className="text-xs font-mono text-muted-foreground break-words">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full font-bold shadow-lg hover:opacity-90 transition-all"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Refreshing
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-4 rounded-full font-bold hover:bg-secondary/80 transition-all"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
