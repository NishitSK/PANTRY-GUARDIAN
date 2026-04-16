import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { PushSubscriber } from '@/models'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
	try {
		const { userId } = await auth()

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { endpoint } = await req.json()

		await connectDB()

		const result = await (PushSubscriber as any).deleteOne({ endpoint, userId })

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{ error: 'Subscription not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json({ message: 'Unsubscribed successfully' })
	} catch (error) {
		console.error('Push unsubscribe error:', error)
		return NextResponse.json(
			{ error: 'Failed to unsubscribe' },
			{ status: 500 }
		)
	}
}
