import React from 'react';
import { logComponentError } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // Use global error logger
        logComponentError(error, errorInfo);

        // Log error to backend (optional)
        try {
            fetch('/api/errors/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: error.toString(),
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    timestamp: new Date().toISOString(),
                })
            });
        } catch (e) {
            console.error('Failed to log error:', e);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[#121214] border border-zinc-800 rounded-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="font-secondary text-2xl text-white mb-2">Oops! Ada yang salah</h1>
                        <p className="text-zinc-400 mb-6">
                            Aplikasi mengalami error. Coba salah satu opsi berikut:
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mb-6 bg-zinc-900/50 p-4 rounded text-xs">
                                <summary className="text-red-400 cursor-pointer mb-2">Detail Error (Development)</summary>
                                <pre className="text-zinc-400 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 px-6 bg-[#D4AF37] text-black hover:bg-[#B5952F] rounded-sm font-semibold transition-colors"
                            >
                                🔄 Coba Lagi
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 px-6 bg-zinc-800 text-white hover:bg-zinc-700 rounded-sm font-semibold transition-colors"
                            >
                                ♻️ Reload Halaman
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="w-full py-3 px-6 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 rounded-sm font-semibold transition-colors"
                            >
                                🏠 Kembali ke Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
