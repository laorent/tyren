'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: '1rem', border: '1px solid #ff4d4f', borderRadius: '0.5rem', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>渲染此消息时出错</p>
                    <p style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{this.state.error?.message}</p>
                </div>
            )
        }

        return this.props.children
    }
}
