'use client'

import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')

    useEffect(() => {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('tyren-theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
            // Force default to light based on user request "White is fine"
            const systemTheme = 'light' // was: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            setTheme(systemTheme)
            document.documentElement.setAttribute('data-theme', systemTheme)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('tyren-theme', newTheme)
    }

    return (
        <button
            className={styles.toggleButton}
            onClick={toggleTheme}
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            aria-label="Toggle theme"
        >
            <div className={styles.iconWrapper}>
                <svg className={styles.sunIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <svg className={styles.moonIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </div>
        </button>
    )
}
