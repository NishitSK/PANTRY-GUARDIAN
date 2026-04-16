import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/lib/api'

export function usePushNotifications() {
	const [isSupported, setIsSupported] = useState(false)
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [subscription, setSubscription] = useState<PushSubscription | null>(null)

	useEffect(() => {
		// Check if browser supports service workers and push notifications
		const supported =
			'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

		setIsSupported(supported)

		if (supported) {
			// Check if already subscribed
			navigator.serviceWorker.ready.then((registration) => {
				registration.pushManager.getSubscription().then((sub) => {
					setSubscription(sub)
					setIsSubscribed(!!sub)
				})
			})
		}
	}, [])

	const subscribeToNotifications = async () => {
		if (!isSupported || !('serviceWorker' in navigator)) {
			alert('Push notifications are not supported in your browser')
			return false
		}

		const baseUrl = getApiBaseUrl()

		try {
			// Request permission
			if (Notification.permission === 'denied') {
				alert('Notifications are blocked. Please enable them in browser settings.')
				return false
			}

			if (Notification.permission !== 'granted') {
				const permission = await Notification.requestPermission()
				if (permission !== 'granted') {
					return false
				}
			}

			// Register service worker
			const registration = await navigator.serviceWorker.register('/service-worker.js')

			// Subscribe to push
			const sub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(
					process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
				),
			})

			// Send subscription to server
			const response = await fetch(`${baseUrl}/api/push/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(sub),
			})

			if (response.ok) {
				setSubscription(sub)
				setIsSubscribed(true)
				return true
			}
		} catch (error) {
			console.error('Failed to subscribe to notifications:', error)
		}

		return false
	}

	const unsubscribeFromNotifications = async () => {
		if (!subscription) return false
		const baseUrl = getApiBaseUrl()

		try {
			const response = await fetch(`${baseUrl}/api/push/unsubscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ endpoint: subscription.endpoint }),
			})

			if (response.ok) {
				await subscription.unsubscribe()
				setSubscription(null)
				setIsSubscribed(false)
				return true
			}
		} catch (error) {
			console.error('Failed to unsubscribe from notifications:', error)
		}

		return false
	}

	return {
		isSupported,
		isSubscribed,
		subscribeToNotifications,
		unsubscribeFromNotifications,
	}
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}
