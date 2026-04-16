import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push'

export async function POST(req: NextRequest) {
	try {
		// Verify internal request (basic auth or API key could be added)
		const authHeader = req.headers.get('authorization')
		if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { userId, title, body, icon, badge, tag, data } = await req.json()
		const { sent, failed } = await sendPushToUser(userId, {
			title,
			body,
			icon,
			badge,
			tag,
			data,
		})

		return NextResponse.json({
			message: 'Notifications sent',
			sent,
			failed,
		})
	} catch (error) {
		console.error('Push send error:', error)
		return NextResponse.json(
			{ error: 'Failed to send notifications' },
			{ status: 500 }
		)
	}
}
