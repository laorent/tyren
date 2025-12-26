'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './ChatInterface.module.css'
import MessageList from '@/components/MessageList'
import InputArea from '@/components/InputArea'
import ThemeToggle from '@/components/ThemeToggle'
import { getAuthToken } from '@/lib/auth'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    images?: string[]
    timestamp: number
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchEnabled, setSearchEnabled] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const abortControllerRef = useRef<AbortController | null>(null)
    const isSendingRef = useRef(false) // Re-entrancy guard

    // Load messages from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('tyren_chat_history')
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages))
            } catch (e) {
                console.error('Failed to load chat history:', e)
            }
        }
    }, [])

    // Debounced save to localStorage to save resources during streaming
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                if (messages.length > 0) {
                    localStorage.setItem('tyren_chat_history', JSON.stringify(messages))
                } else {
                    localStorage.removeItem('tyren_chat_history')
                }
            } catch (e) {
                console.warn('LocalStorage full, failed to save history:', e)
                // Optional: We could try to slice the messages array to save only the most recent ones here
                // but for now, just preventing the crash is the most important step for stability.
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [messages])

    const handleSendMessage = async (content: string, images: string[]) => {
        if (!content.trim() && images.length === 0) return
        if (isSendingRef.current) return // Prevent duplicate requests

        isSendingRef.current = true;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            images,
            timestamp: Date.now(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        // Create assistant message placeholder
        const assistantMessageId = (Date.now() + 1).toString()
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        }
        setMessages(prev => [...prev, assistantMessage])

        try {
            abortControllerRef.current = new AbortController()

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    // Maximize free tier: Only send last 12 messages and prune images from history
                    messages: [...messages, userMessage]
                        .slice(-12) // Sliding window: Keep last 12 messages
                        .map((msg, idx, arr) => {
                            const isLastMessage = idx === arr.length - 1;
                            return {
                                role: msg.role,
                                content: msg.content,
                                // Only send images for the CURRENT (last) message to save tokens
                                // Gemini keeps context in conversation, so repeated image bits are wasteful
                                images: isLastMessage ? msg.images : undefined,
                            };
                        }),
                    searchEnabled,
                }),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                if (response.status === 401) {
                    const text = await response.clone().text().catch(() => '')
                    if (text === 'Unauthorized') {
                        // Session token is invalid, force logout
                        localStorage.removeItem('tyren_auth_token')
                        sessionStorage.removeItem('tyren_auth_token')
                        window.location.reload()
                        return
                    }
                }
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `请求失败 (${response.status})`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('No response body')
            }

            let accumulatedContent = ''
            let lastUpdateTime = 0
            let buffer = '' // Buffer for handling split chunks
            const UPDATE_INTERVAL = 50

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                const lines = buffer.split('\n')
                // The last element is a potential partial line, so we keep it in the buffer
                // and process only the complete lines before it.
                buffer = lines.pop() || ''

                let hasUpdates = false

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') continue

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.error) {
                                throw new Error(parsed.error)
                            }
                            if (parsed.content) {
                                accumulatedContent += parsed.content
                                hasUpdates = true
                            }
                        } catch (e) {
                            // If JSON parse fails, it might be a corrupted line or edge case, 
                            // but usually the buffer strategy prevents this.
                            console.warn('JSON parse error:', e, line)
                        }
                    }
                }

                if (hasUpdates) {
                    const now = Date.now()
                    if (now - lastUpdateTime > UPDATE_INTERVAL) {
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: accumulatedContent }
                                    : msg
                            )
                        )
                        lastUpdateTime = now
                    }
                }
            }

            // Process any remaining characters in the buffer
            if (buffer && buffer.trim()) {
                const lines = buffer.split('\n')
                for (const line of lines) {
                    if (line.trim() === '') continue
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') continue // We might find [DONE] in the buffer
                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.content) {
                                accumulatedContent += parsed.content
                            }
                        } catch (e) {
                            console.warn('Final buffer parse error:', e)
                        }
                    }
                }
            }

            // Check if we received the explicit [DONE] signal or if the stream ended naturally.
            // Note: In this simple implementation, we assume if we have content, it's good.
            // But if the loop broke early due to error, we already handled it in catch.
            // We can check if the response was cut off by checking content length vs expected? Hard.
            // Instead, let's just ensure the final update happens.

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                )
            )

            // Final update to ensure everything is synced
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                )
            )
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request aborted')
            } else {
                console.error('Error:', error)
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: `⚠️ 出错了：${error.message}` }
                            : msg
                    )
                )
            }
        } finally {
            setIsLoading(false)
            isSendingRef.current = false
            abortControllerRef.current = null
        }
    }

    const handleClearChat = () => {
        if (confirm('确定要清除所有对话吗？')) {
            setMessages([])
        }
    }

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsLoading(false)
        }
    }

    const handleSelectSuggestion = (text: string) => {
        setInputValue(text)
        // Reset inputValue after a short delay so it can be re-triggered if needed
        setTimeout(() => setInputValue(''), 100)
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.logoSection}>
                        <div className={styles.logoIcon}>
                            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="h-tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00E5FF" />
                                        <stop offset="100%" stopColor="#0072FF" />
                                    </linearGradient>
                                </defs>
                                <path d="M50 15 L80.3 32.5 L80.3 67.5 L50 85 L19.7 67.5 L19.7 32.5 Z" stroke="url(#h-tech-grad)" strokeWidth="4" strokeDasharray="5 5" strokeLinejoin="round" />
                                <circle cx="50" cy="50" r="12" fill="url(#h-tech-grad)" />
                                <path d="M50 15 L50 38 M80.3 32.5 L58.7 45 M80.3 67.5 L58.7 55 M50 85 L50 62 M19.7 67.5 L41.3 55 M19.7 32.5 L41.3 45" stroke="url(#h-tech-grad)" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h1 className={styles.title}>Tyren</h1>
                    </div>

                    <div className={styles.controls}>
                        <button
                            className={`${styles.controlButton} ${searchEnabled ? styles.active : ''}`}
                            onClick={() => setSearchEnabled(!searchEnabled)}
                            title={searchEnabled ? '关闭联网搜索' : '开启联网搜索'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                        </button>

                        <button
                            className={styles.controlButton}
                            onClick={handleClearChat}
                            title="清除对话"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>

                        <div className={styles.themeToggleWrapper}>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    onSelectSuggestion={handleSelectSuggestion}
                />
            </main>

            <footer className={styles.footer}>
                <InputArea
                    onSend={handleSendMessage}
                    disabled={isLoading}
                    onStop={handleStopGeneration}
                    externalContent={inputValue}
                />
            </footer>
        </div>
    )
}
