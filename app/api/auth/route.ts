import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { password } = await req.json()
        const validPassword = process.env.WEB_ACCESS_PASSWORD

        if (!validPassword) {
            return NextResponse.json(
                { error: 'Server authentication not configured' },
                { status: 500 }
            )
        }

        if (password === validPassword) {
            // Success: Return a dynamic token that DOES NOT contain the password
            // We use the password to 'pick' a secret from the environment
            const sessionSecret = process.env.GEMINI_API_KEY?.slice(0, 10) || 'default_secret';
            const dynamicToken = Buffer.from(`${sessionSecret}_valid_session`).toString('base64');
            return NextResponse.json({ token: dynamicToken })
        }

        // FAILURE DEFENSE: Add a 2-second delay to slow down brute-force scripts
        await new Promise(resolve => setTimeout(resolve, 2000));

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    } catch (error) {
        // Even on error, add a small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
