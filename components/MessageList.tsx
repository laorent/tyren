'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from './ChatInterface'
import styles from './MessageList.module.css'

interface MessageListProps {
    messages: Message[]
    isLoading: boolean
    onSelectSuggestion: (text: string) => void
}

function CodeBlock({ language, value }: { language: string, value: string }) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={styles.codeBlockContainer}>
            <div className={styles.codeBlockHeader}>
                <span className={styles.codeLanguage}>{language || 'text'}</span>
                <button
                    onClick={copyToClipboard}
                    className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                >
                    {copied ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>已复制</span>
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                            <span>复制</span>
                        </>
                    )}
                </button>
            </div>
            <pre className={styles.pre}>
                <code className={language ? `language-${language}` : ''}>{value}</code>
            </pre>
        </div>
    )
}


const ALL_QUESTIONS = [
    // 创作与写作
    "请写一段关于人工智能未来的短文",
    "帮我写一段吸引人的小红书文案",
    "帮我写一封正式的离职信",
    "写一个关于星际旅行的科幻微小说开头",
    "帮我策划一个关于摄影的短视频脚本",

    // 职场与效率
    "如何制作一份完美的简历？",
    "作为面试官，你会问前端工程师哪些问题？",
    "帮我写一份周报总结，包含本周完成的工作和下周计划",
    "如何高效地进行时间管理？",
    "请帮我翻译一段英文商业邮件",

    // 生活与健康
    "帮我制定一个为期一周的健身计划",
    "推荐几部好读的科幻小说",
    "如何从零开始学习摄影？",
    "帮我列一份健康的减脂晚餐食谱",
    "推荐几个适合一个人旅行的小众目的地",
    "如何改善睡眠质量？",

    // 编程与技术
    "用 TypeScript 写一个快速排序算法",
    "解释一下量子纠缠",
    "如何系统地学习 React 框架？",
    "解释一下什么是 RESTful API",
    "如何优化 Next.js 应用的加载速度？",
    "Git 常用命令总结",
    "什么是 Docker 的基本概念？",

    // 知识与思考
    "人工智能相比人类有哪些优势和局限性？",
    "翻译：'The early bird catches the worm' 并解释含义",
    "解释一下费曼学习法",
    "什么是幸存者偏差？请举例说明",
    "如何建立自己的知识管理体系？",
    "介绍一下深度学习的基本原理"
]

export default function MessageList({ messages, isLoading, onSelectSuggestion }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [randomQuestions, setRandomQuestions] = useState<string[]>([])

    const refreshQuestions = () => {
        const shuffled = [...ALL_QUESTIONS].sort(() => 0.5 - Math.random())
        setRandomQuestions(shuffled.slice(0, 4))
    }

    useEffect(() => {
        // Randomize questions on mount or when chat is cleared
        if (messages.length === 0) {
            refreshQuestions()
        }
    }, [messages.length])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    if (messages.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="e-tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#4facfe" />
                                <stop offset="100%" stopColor="#00f2fe" />
                            </linearGradient>
                        </defs>
                        <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 L50 5Z" stroke="url(#e-tech-grad)" strokeWidth="2" strokeDasharray="4 4" />
                        <circle cx="50" cy="50" r="12" fill="url(#e-tech-grad)" />
                        <path d="M50 15 L50 38 M50 62 L50 85 M10 28 L40 45 M60 55 L90 72 M10 72 L40 55 M60 45 L90 28" stroke="url(#e-tech-grad)" strokeWidth="1.5" />
                    </svg>
                </div>
                <h2 className={styles.emptyTitle}>开始新对话</h2>
                <p className={styles.emptySubtitle}>
                    我是 Tyren AI，支持文本处理、图像解析与实时数据检索
                </p>
                <div className={styles.suggestions}>
                    <div className={styles.suggestionCard} onClick={() => onSelectSuggestion("支持长上下文对话是什么意思？")}>
                        <div className={styles.suggestionIcon}>💬</div>
                        <p>支持长上下文对话</p>
                    </div>
                    <div className={styles.suggestionCard} onClick={() => onSelectSuggestion("你能帮我分析这张图吗？")}>
                        <div className={styles.suggestionIcon}>🖼️</div>
                        <p>图像理解与分析</p>
                    </div>
                    <div className={styles.suggestionCard} onClick={() => onSelectSuggestion("请帮我联网搜索一下最近的大新闻")}>
                        <div className={styles.suggestionIcon}>🌐</div>
                        <p>实时联网搜索</p>
                    </div>
                </div>

                <div className={styles.questionSection}>
                    <div className={styles.questionHeader}>
                        <p className={styles.questionHint}>猜你想问：</p>
                        <button className={styles.refreshButton} onClick={refreshQuestions} title="换一批">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                            <span>换一批</span>
                        </button>
                    </div>
                    <div className={styles.questionGrid}>
                        {randomQuestions.map((q, i) => (
                            <button key={i} className={styles.questionItem} onClick={() => onSelectSuggestion(q)}>
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.messageList}>
            <div className={styles.messageContainer}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage
                            }`}
                    >
                        <div className={styles.messageContent}>
                            <div className={styles.messageAvatar}>
                                {message.role === 'user' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 100 100" fill="none">
                                        <defs>
                                            <linearGradient id="a-tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#4facfe" />
                                                <stop offset="100%" stopColor="#00f2fe" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 L50 10Z" fill="url(#a-tech-grad)" fillOpacity="0.1" stroke="url(#a-tech-grad)" strokeWidth="4" />
                                        <circle cx="50" cy="50" r="10" fill="url(#a-tech-grad)" />
                                    </svg>
                                )}
                            </div>

                            <div className={styles.messageBubble}>
                                {message.images && message.images.length > 0 && (
                                    <div className={styles.imagesGrid}>
                                        {message.images.map((image, index) => (
                                            <div key={index} className={styles.imageWrapper}>
                                                <img src={image} alt={`Upload ${index + 1}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {message.content && (
                                    <div className={styles.messageText}>
                                        {message.role === 'assistant' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        return !inline ? (
                                                            <CodeBlock
                                                                language={match ? match[1] : ''}
                                                                value={String(children).replace(/\n$/, '')}
                                                                {...props}
                                                            />
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <p>{message.content}</p>
                                        )}
                                    </div>
                                )}

                                {message.role === 'assistant' && !message.content && isLoading && (
                                    <div className={styles.loadingDots}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}
