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

		const subscription = await req.json()

		await connectDB()

		// Check if subscription already exists
		const existing = await (PushSubscriber as any).findOne({
			endpoint: subscription.endpoint,
		})

		if (existing) {
			return NextResponse.json(
				{ message: 'Already subscribed' },
				{ status: 200 }
			)
		}

		// Save new subscription
		const newSubscription = await (PushSubscriber as any).create({
			userId,
			endpoint: subscription.endpoint,
			auth: subscription.keys.auth,
			p256dh: subscription.keys.p256dh,
		})

		return NextResponse.json(
			{ message: 'Subscribed successfully', subscription: newSubscription },
			{ status: 201 }
		)
	} catch (error) {
		console.error('Push subscribe error:', error)
		return NextResponse.json(
			{ error: 'Failed to subscribe' },
			{ status: 500 }
		)
	}
}
