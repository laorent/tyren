'use client'

import { useState } from 'react'
import styles from './LoginScreen.module.css'

interface LoginScreenProps {
    onLogin: (password: string, remember: boolean) => Promise<boolean>
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [password, setPassword] = useState('')
    const [remember, setRemember] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const success = await onLogin(password, remember)

        if (!success) {
            setError('密码错误，请重试')
            setPassword('')
        }

        setIsLoading(false)
    }

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.gradient1}></div>
                <div className={styles.gradient2}></div>
                <div className={styles.gradient3}></div>
            </div>

            <div className={styles.loginCard}>
                <div className={styles.logoContainer}>
                    <div className={styles.logo}>
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4facfe" />
                                    <stop offset="100%" stopColor="#00f2fe" />
                                </linearGradient>
                                <linearGradient id="tech-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#667eea" />
                                    <stop offset="100%" stopColor="#764ba2" />
                                </linearGradient>
                            </defs>
                            {/* Outer Hexagon */}
                            <path d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 L50 5Z" stroke="url(#tech-grad)" strokeWidth="2" strokeDasharray="5 5" />
                            {/* Inner Hexagon */}
                            <path d="M50 15 L80 32.5 L80 67.5 L50 85 L20 67.5 L20 32.5 L50 15Z" fill="url(#tech-grad-2)" fillOpacity="0.2" stroke="url(#tech-grad-2)" strokeWidth="1" />
                            {/* Neural Nodes */}
                            <circle cx="50" cy="50" r="12" fill="url(#tech-grad)" />
                            <circle cx="50" cy="50" r="18" stroke="url(#tech-grad)" strokeWidth="0.5" opacity="0.5" />
                            <path d="M50 15 L50 38 M50 62 L50 85 M20 32.5 L40 45 M60 55 L80 67.5 M20 67.5 L40 55 M60 45 L80 32.5" stroke="url(#tech-grad)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className={styles.title}>Tyren</h1>
                    <p className={styles.subtitle}>数据节点已连接 · 状态监控运行中</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入访问密码"
                            className={styles.input}
                            disabled={isLoading}
                            autoFocus
                        />
                        {error && <p className={styles.error}>{error}</p>}
                    </div>

                    <div className={styles.optionsGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>30 天内自动登录 (推荐 PWA 用户)</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={isLoading || !password}
                    >
                        {isLoading ? (
                            <span className={styles.spinner}></span>
                        ) : (
                            '开始连接'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>© 2025 Tyren Tech. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
