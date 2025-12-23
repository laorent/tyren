import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization')
        const sessionSecret = process.env.GEMINI_API_KEY?.slice(0, 10) || 'default_secret';
        const expectedToken = Buffer.from(`${sessionSecret}_valid_session`).toString('base64');

        if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { messages, searchEnabled } = await req.json()
        const apiKey = process.env.GEMINI_API_KEY
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'

        if (!apiKey) {
            return new Response('API Key not configured', { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)

        // Tools configuration
        const tools: any[] = []
        if (searchEnabled) {
            tools.push({ googleSearch: {} })
        }

        const model = genAI.getGenerativeModel({
            model: modelName,
            tools: tools,
        })

        const chatHistory = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.images && msg.images.length > 0
                ? [
                    { text: msg.content },
                    ...msg.images.map((img: string) => {
                        const [mimeType, base64Data] = img.split(';base64,')
                        return {
                            inlineData: {
                                mimeType: mimeType.split(':')[1],
                                data: base64Data,
                            },
                        }
                    })
                ]
                : [{ text: msg.content }],
        }))

        const lastMessage = messages[messages.length - 1]
        const currentParts = lastMessage.images && lastMessage.images.length > 0
            ? [
                { text: lastMessage.content || '分析这张图片' },
                ...lastMessage.images.map((img: string) => {
                    const [mimeType, base64Data] = img.split(';base64,')
                    return {
                        inlineData: {
                            mimeType: mimeType.split(':')[1],
                            data: base64Data,
                        },
                    }
                })
            ]
            : [{ text: lastMessage.content }]

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 2048,
            },
        })

        const result = await chat.sendMessageStream(currentParts)

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text()
                        if (chunkText) {
                            const data = JSON.stringify({ content: chunkText })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                } catch (error: any) {
                    console.error('Streaming error:', error)
                    // If streaming fails midway, send an error event
                    let errorMsg = '生成过程中发生错误'
                    if (error.message?.includes('429')) {
                        errorMsg = 'API 额度已达上限，请一天后再试'
                    } else if (error.message?.includes('finishReason: SAFETY')) {
                        errorMsg = '内容由于安全策略被拦截，请尝试换个话题'
                    }
                    const data = JSON.stringify({ error: errorMsg })
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error: any) {
        console.error('Chat API Error:', error)
        let status = 500
        let errorMsg = '服务器内部错误'

        if (error.message?.includes('429')) {
            status = 429
            errorMsg = '当前访问节点流量已达上限，请一天后再试'
        } else if (error.message?.includes('401') || error.message?.includes('API key not valid')) {
            status = 401
            errorMsg = 'API Key 无效，请检查环境变量配置'
        } else if (error.message?.includes('model not found')) {
            status = 404
            errorMsg = '未找到指定的模型，请检查 GEMINI_MODEL 配置'
        }

        return new Response(JSON.stringify({ error: errorMsg }), {
            status: status,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
