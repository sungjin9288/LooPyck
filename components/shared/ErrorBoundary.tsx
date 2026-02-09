'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StateVisualizer } from './StateVisualizer';
import { Logger } from '../../lib/core/observability';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        Logger.error('Unhandled React Error', error, {
            componentStack: errorInfo.componentStack
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload(); // Hard reload for clean state
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <StateVisualizer
                        state="error"
                        message="Something went wrong. Our best engineers have been notified."
                        onRetry={this.handleRetry}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
