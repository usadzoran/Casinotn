import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[5LION ErrorBoundary] Uncaught runtime error caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {
      // ignore
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#0a0a0e] text-zinc-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-black font-sans"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#121218] border border-amber-500/30 p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Emblem */}
            <div className="relative z-10 mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>

            {/* Title */}
            <h2 className="relative z-10 text-xl md:text-2xl font-black text-white mb-2">
              تعذر تحميل المنصة
            </h2>

            <p className="relative z-10 text-xs md:text-sm text-zinc-400 leading-relaxed mb-6">
              حدث خطأ غير متوقع أثناء معالجة الصفحة. يمكنك النقر على زر إعادة المحاولة للعودة إلى المنصة فوراً.
            </p>

            {/* Action Buttons */}
            <div className="relative z-10 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
            </div>

            {/* Dev Details (Strictly visible only in development mode) */}
            {isDev && this.state.error && (
              <div className="relative z-10 mt-6 pt-4 border-t border-zinc-800 text-right">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-zinc-500 hover:text-amber-400 flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <span>تفاصيل الخطأ الفني (وضع التطوير فقط)</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 rounded-xl bg-black/80 border border-red-500/30 text-red-400 text-[11px] font-mono text-left ltr overflow-x-auto max-h-48">
                    <p className="font-bold text-red-300 mb-1">{this.state.error.toString()}</p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
