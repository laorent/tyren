'use client'

import { useEffect, useRef, useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Message } from './ChatInterface'
import ErrorBoundary from './ErrorBoundary'
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
    // 自然科学 (Natural Sciences)
    "解释一下广义相对论的核心概念",
    "什么是寒武纪大爆发？它对生物进化有何意义？",
    "黑洞是如何形成的？它们最终会消失吗？",
    "植物是如何通过光合作用转化能量的？",
    "大陆漂移学说的证据有哪些？",
    "量子叠加态和量子纠缠有什么区别？",
    "什么是量子隧穿效应？",
    "解释一下恒星演化的主要阶段（从红巨星到黑洞）",
    "什么是暗物质和暗能量？它们在宇宙中占据多大比例？",
    "DNA 的双螺旋结构是如何存储遗传信息的？",
    "简单解释一下抗生素的工作原理及其局限性",
    "地磁场是如何产生的？它对地球生命有何保护作用？",
    "什么是引力透镜效应？",
    "介绍一下元素周期表的排列逻辑",
    "什么是多普勒效应？它在天文学中如何应用？",

    // 人文历史 (Humanities & History)
    "文艺复兴运动对现代西方文明产生了哪些深远影响？",
    "介绍一下古埃及金字塔的建筑结构与用途",
    "工业革命是如何改变人类社会结构的？",
    "中国古代丝绸之路的经济与文化意义是什么？",
    "简述荷马史诗在西方文学史上的地位",
    "印象派绘画运动的主要特点是什么？",
    "大航海时代对全球化进程的起点作用",
    "什么是存在主义文学？以萨特或加缪为例",
    "介绍一下巴洛克艺术风格的审美特征",
    "简述古希腊悲剧的核心精神",
    "美索不达米亚文明对人类法律 and 文字的贡献",
    "什么是文化相对主义？它在人类学研究中为何重要？",
    "介绍一下日本明治维新的社会影响",
    "什么是后殖民主义理论？",

    // 社会科学 (Social Sciences)
    "阐述供需曲线的基本原理及其在现实市场中的应用",
    "什么是马斯洛需求层次理论？",
    "博弈论中的‘囚徒困境’说明了什么问题？",
    "认知偏差（如确认偏误）是如何影响人类判断的？",
    "社会契约论的核心观点是什么？",
    "介绍一下行为经济学中的‘锚定效应’",
    "什么是马太效应？它在社会财富分配中如何体现？",
    "解释一下米尔格拉姆实验揭示的人性与权力关系",
    "什么是‘认知失调’理论？请举例说明",
    "解释一下社会化过程中的‘镜中之我’理论",
    "什么是凯恩斯主义经济学？",
    "什么是皮亚杰的儿童认知发展阶段理论？",
    "解释一下经济学中的‘格雷欣法则’（劣币驱逐良币）",

    // 哲学与思考 (Philosophy & Logic)
    "苏格拉底教学法的核心是什么？",
    "简单解释一下什么是存在主义哲学",
    "什么是电车难题？它反映了哪两种道德哲学的冲突？",
    "奥卡姆剃刀原则在科学研究中如何应用？",
    "什么是不可知论？",
    "柏拉图的‘洞穴隐喻’想要传达什么哲理？",
    "‘我思故我在’的哲学背景及意义",
    "什么是归纳法与演绎法？它们在逻辑推理中有何区别？",
    "什么是康德的‘定言令式’？",
    "简述尼采‘超人哲学’的内涵",
    "什么是维特根斯坦的‘语言游戏’说？",
    "介绍一下黑格尔的辩证法（正、反、合）",
    "简述庄子的‘齐物论’思想",

    // 数学与逻辑 (Mathematics & Logic)
    "什么是欧几里得几何与非欧几何的区别？",
    "简单解释一下费马大定理的历史背景",
    "什么是哥德尔不完备定理？",
    "解释一下黄金分割比例在自然 and 艺术中的体现",
    "什么是混沌理论？‘蝴蝶效应’源自哪里？",
    "简单介绍一下纳什均衡在经济学中的地位",
    "什么是概率论中的‘大数定律’？",
    "什么是欧拉公式 e^(iπ) + 1 = 0 的美学意义？",
    "什么是蒙提霍尔问题（三门问题）？",
    "什么是拓扑学中的‘莫比乌斯环’？",
    "解释一下二进制逻辑在现代计算机架构中的基础作用",
    "什么是康托尔的集合论与无穷大分类？",

    // 技术、艺术与跨学科 (Tech, Art & Interdisciplinary)
    "香农信息论对现代通讯的影响是什么？",
    "图灵测试是如何定义‘智能’的？",
    "什么是热力学第二定律？为什么它与时间的方向有关？",
    "仿生学是如何在工程设计中借鉴生物特征的？",
    "介绍一下控制论的基本思想",
    "大模型的工作原理与人类大脑处理语言的方式有何异同？",
    "包豪斯建筑风格的核心理念是什么？",
    "什么是线性透视法？它如何改变了文艺复兴时期的绘画？",
    "解释一下区块链去中心化的核心机制（共识算法）",
    "什么是数字孪生（Digital Twin）技术？",
    "解释一下复杂系统（Complex Systems）中的‘涌现’现象",
    "什么是算法伦理中的‘算法黑箱’问题？",
    "十二音技法是如何改变现代音乐面貌的？",
    "什么是电影蒙太奇（Montage）剪辑手法？",
    "简述中国古代建筑‘斗拱’的作用"
]

const MessageItem = memo(({ message, isLoading, onCodeCopy }: { message: Message, isLoading: boolean, onCodeCopy?: (text: string) => void }) => {
    return (
        <div
            className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
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
                                <linearGradient id={`grad-${message.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4facfe" />
                                    <stop offset="100%" stopColor="#00f2fe" />
                                </linearGradient>
                            </defs>
                            <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 L50 10Z" fill={`url(#grad-${message.id})`} fillOpacity="0.1" stroke={`url(#grad-${message.id})`} strokeWidth="4" />
                            <circle cx="50" cy="50" r="10" fill={`url(#grad-${message.id})`} />
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
                                isLoading ? (
                                    /* 
                                     * PROGRESSIVE RENDERING PRO: 
                                     * During streaming, complex Latex/Markdown can be incomplete (invalid),
                                     * causing render crashes or layout shifts on mobile.
                                     * We show raw text (or simple markdown) while streaming, 
                                     * and switch to full rich render only when the message is complete.
                                     */
                                    <div className={styles.streamingText}>
                                        {message.content}
                                    </div>
                                ) : (
                                    <ErrorBoundary fallback={
                                        <div className={styles.errorState}>
                                            <p>⚠️ 内容渲染出错</p>
                                            <pre className={styles.rawContent}>{message.content}</pre>
                                        </div>
                                    }>
                                        <div className={styles.renderedContent}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
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
                                        </div>
                                    </ErrorBoundary>
                                )
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
    )
}, (prev: { message: Message, isLoading: boolean }, next: { message: Message, isLoading: boolean }) => {
    // Custom comparison for performance
    return prev.message.content === next.message.content &&
        prev.message.images === next.message.images &&
        prev.isLoading === next.isLoading;
})

MessageItem.displayName = 'MessageItem'

export default function MessageList({ messages, isLoading, onSelectSuggestion }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [randomQuestions, setRandomQuestions] = useState<string[]>([])
    const [questionPool, setQuestionPool] = useState<string[]>([])
    const [poolIndex, setPoolIndex] = useState(0)

    // Fisher-Yates shuffle helper
    const shuffle = (array: string[]) => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    const refreshQuestions = () => {
        let currentPool = questionPool
        let nextIndex = poolIndex

        // If pool is empty or near exhaustion, reshuffle
        if (currentPool.length === 0 || nextIndex + 4 > currentPool.length) {
            currentPool = shuffle(ALL_QUESTIONS)
            nextIndex = 0
            setQuestionPool(currentPool)
        }

        const newSet = currentPool.slice(nextIndex, nextIndex + 4)
        setRandomQuestions(newSet)
        setPoolIndex(nextIndex + 4)
    }

    useEffect(() => {
        // Randomize questions on mount or when chat is cleared
        if (messages.length === 0) {
            refreshQuestions()
        }
    }, [messages.length])

    const prevMessagesLength = useRef(messages.length)

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    useEffect(() => {
        // Fix for mobile: Use 'auto' (instant) scroll during streaming to prevent
        // layout thrashing and "jumping" glitches caused by overlapping smooth animations.
        // Only use smooth scroll when a completely new message bubble is added.
        const isNewMessage = messages.length > prevMessagesLength.current
        const isStreamingUpdate = messages.length === prevMessagesLength.current && isLoading

        if (isNewMessage) {
            scrollToBottom('smooth')
        } else if (isStreamingUpdate) {
            scrollToBottom('auto')
        }

        prevMessagesLength.current = messages.length
    }, [messages, isLoading])

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
                {messages.map((message, index) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        isLoading={isLoading && index === messages.length - 1}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}
