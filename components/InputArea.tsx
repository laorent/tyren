'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './InputArea.module.css'

interface InputAreaProps {
    onSend: (content: string, images: string[]) => void
    disabled: boolean
    onStop: () => void
    externalContent?: string
}

export default function InputArea({ onSend, disabled, onStop, externalContent }: InputAreaProps) {
    const [content, setContent] = useState('')
    const [images, setImages] = useState<string[]>([])

    // Update internal content when externalContent changes
    useEffect(() => {
        if (externalContent) {
            setContent(externalContent)
            // Focus and adjust height
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.style.height = 'auto'
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
            }
        }
    }, [externalContent])

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSend = () => {
        if ((content.trim() || images.length > 0) && !disabled) {
            onSend(content, images)
            setContent('')
            setImages([])
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !disabled) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value)
        // Auto resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200; // Optimized for Gemini analysis
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress as JPEG with 0.7 quality to balance detail and token size
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const uploadPromises = Array.from(files).map(file => compressImage(file));
        const compressedImages = await Promise.all(uploadPromises);

        setImages(prev => [...prev, ...compressedImages]);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className={styles.inputContainer}>
            {images.length > 0 && (
                <div className={styles.imagePreview}>
                    {images.map((img, index) => (
                        <div key={index} className={styles.previewItem}>
                            <img src={img} alt="Preview" />
                            <button
                                className={styles.removeButton}
                                onClick={() => removeImage(index)}
                                title="移除图片"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.inputWrapper}>
                <button
                    className={styles.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                    title="上传图片"
                    disabled={disabled}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    hidden
                />

                <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    placeholder="输入消息，Shift+Enter 换行"
                    value={content}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                />

                {disabled ? (
                    <button className={styles.stopButton} onClick={onStop} title="停止生成">
                        <div className={styles.stopSquare}></div>
                    </button>
                ) : (
                    <button
                        className={styles.sendButton}
                        onClick={handleSend}
                        disabled={!content.trim() && images.length === 0}
                        title="发送"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}
