import webpush from 'web-push'
import connectDB from '@/lib/mongodb'
import { PushSubscriber } from '@/models'

let vapidConfigured = false

function ensureVapidConfigured() {
	if (vapidConfigured) return true

	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
	const privateKey = process.env.VAPID_PRIVATE_KEY
	const subject = process.env.VAPID_SUBJECT || 'mailto:support@pantyguardian.app'

	if (!publicKey || !privateKey) {
		console.warn('Push notifications disabled: missing VAPID keys')
		return false
	}

	webpush.setVapidDetails(subject, publicKey, privateKey)
	vapidConfigured = true
	return true
}

export type PushPayload = {
	title: string
	body: string
	icon?: string
	badge?: string
	tag?: string
	data?: Record<string, unknown>
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
	if (!ensureVapidConfigured()) {
		return { sent: 0, failed: 0 }
	}

	await connectDB()

	const subscriptions = await (PushSubscriber as any).find({ userId })
	const notification = {
		title: payload.title,
		body: payload.body,
		icon: payload.icon || '/logo.png',
		badge: payload.badge || '/logo.png',
		tag: payload.tag || 'notification',
		data: payload.data || {},
	}

	let sent = 0
	let failed = 0

	for (const sub of subscriptions) {
		try {
			await webpush.sendNotification(
				{
					endpoint: sub.endpoint,
					keys: {
						auth: sub.auth,
						p256dh: sub.p256dh,
					},
				},
				JSON.stringify(notification)
			)
			sent++

			await (PushSubscriber as any).updateOne(
				{ _id: sub._id },
				{
					$set: { lastNotificationTime: new Date() },
					$inc: { notificationCount: 1 },
					$push: {
						notificationHistory: {
							notificationType: payload.data?.type || 'notification',
							date: new Date(),
						},
					},
				}
			)
		} catch (error: any) {
			console.error('Failed to send notification:', error)
			if (error?.statusCode === 410) {
				await (PushSubscriber as any).deleteOne({ _id: sub._id })
			}
			failed++
		}
	}

	return { sent, failed }
}