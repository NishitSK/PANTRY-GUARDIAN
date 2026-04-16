import { NextRequest, NextResponse } from 'next/server'
import { addDays } from 'date-fns'
import connectDB from '@/lib/mongodb'
import { Prediction, PushSubscriber, Recipe, User } from '@/models'
import { sendPushToUser } from '@/lib/push'

export async function POST(req: NextRequest) {
	try {
		const authHeader = req.headers.get('authorization')
		if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		await connectDB()

		const results = {
			expiringItemsNotified: 0,
			recipeSuggestionsNotified: 0,
			errors: [] as string[],
		}

		const windowStart = new Date()
		const windowEnd = addDays(new Date(), 3)

		const expiringPredictions = await Prediction.find({
			predictedExpiry: {
				$gte: windowStart,
				$lte: windowEnd,
			},
		})
			.populate({
				path: 'inventoryItemId',
				populate: { path: 'userId' },
			})
			.limit(100)

		const notifiedItems = new Set<string>()

		for (const prediction of expiringPredictions) {
			try {
				const inventoryItem = (prediction as any).inventoryItemId
				const itemUser = inventoryItem?.userId
				if (!inventoryItem || !itemUser) continue

				const itemId = inventoryItem._id.toString()
				if (notifiedItems.has(itemId)) continue
				notifiedItems.add(itemId)

				const itemUserId = String(itemUser._id)
				const subscriber = await (PushSubscriber as any).findOne({ userId: itemUserId })
				const notificationsToday = (subscriber?.notificationHistory || []).filter(
					(notification: any) => {
						const notificationDate = new Date(notification.date || 0)
						notificationDate.setHours(0, 0, 0, 0)
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						return notificationDate.getTime() === today.getTime()
					}
				).length

				if (notificationsToday >= 3) {
					continue
				}

				const daysUntilExpiry = Math.ceil(
					(new Date(prediction.predictedExpiry).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24)
				)

					await sendPushToUser(itemUserId, {
					title: '⏰ Item Expiring Soon',
					body:
						daysUntilExpiry <= 0
							? 'Something in your inventory expires today!'
							: `Something expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
					icon: '/icon.svg',
					badge: '/icon.svg',
					tag: `expiring-${itemId}`,
					data: {
						type: 'expiring-item',
						itemId,
						url: '/inventory',
					},
				})

				results.expiringItemsNotified++
			} catch (error) {
				results.errors.push(`Error notifying about item: ${String(error)}`)
			}
		}

		const users = await User.find().limit(50)

		for (const user of users) {
			try {
				const subscriber = await (PushSubscriber as any).findOne({ userId: user._id.toString() })
				if (!subscriber) continue

				const notificationsToday = (subscriber.notificationHistory || []).filter(
					(notification: any) => {
						const notificationDate = new Date(notification.date || 0)
						notificationDate.setHours(0, 0, 0, 0)
						const today = new Date()
						today.setHours(0, 0, 0, 0)
						return notificationDate.getTime() === today.getTime()
					}
				).length

				if (notificationsToday >= 3) {
					continue
				}

				// Randomized recipe notifications, but still capped per day.
				if (Math.random() < 0.55) {
					const [recipe] = await Recipe.aggregate([{ $sample: { size: 1 } }])
					if (!recipe) continue

					await sendPushToUser(user._id.toString(), {
						title: `👨‍🍳 ${recipe.title}`,
						body: recipe.description
							? `${recipe.description.substring(0, 60)}${recipe.description.length > 60 ? '...' : ''}`
							: 'Try this recipe today!',
						icon: '/icon.svg',
						badge: '/icon.svg',
						tag: `recipe-${recipe._id}`,
						data: {
							type: 'recipe-suggestion',
							recipeId: recipe._id.toString(),
							url: '/recipes',
						},
					})

					results.recipeSuggestionsNotified++
				}
			} catch (error) {
				results.errors.push(`Error sending recipe to user ${user._id}: ${String(error)}`)
			}
		}

		return NextResponse.json({
			message: 'Notifications scheduled successfully',
			...results,
		})
	} catch (error) {
		console.error('Notification scheduler error:', error)
		return NextResponse.json(
			{ error: 'Failed to schedule notifications', details: String(error) },
			{ status: 500 }
		)
	}
}
