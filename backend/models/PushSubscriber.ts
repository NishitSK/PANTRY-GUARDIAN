import { Schema, model, models } from 'mongoose'

const PushSubscriberSchema = new Schema(
	{
		userId: {
			type: String,
			index: true,
			required: true,
		},
		endpoint: {
			type: String,
			required: true,
			unique: true,
		},
		auth: {
			type: String,
			required: true,
		},
		p256dh: {
			type: String,
			required: true,
		},
		notificationCount: {
			type: Number,
			default: 0,
		},
		lastNotificationTime: {
			type: Date,
			default: null,
		},
		notificationHistory: [
			{
				notificationType: String,
				date: Date,
			},
		],
	},
	{ timestamps: true }
)

export default models.PushSubscriber || model('PushSubscriber', PushSubscriberSchema)
