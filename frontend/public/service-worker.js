// Service Worker for Push Notifications

self.addEventListener('push', (event) => {
	const data = event.data?.json() || {}
	const { title, body, icon, badge, tag, data: notificationData } = data

	const options = {
		body: body || 'You have a new notification',
		icon: icon || '/logo.png',
		badge: badge || '/logo.png',
		tag: tag || 'notification',
		data: notificationData || {},
		// Allow browser to display notifications even when site not open
		requireInteraction: false,
	}

	event.waitUntil(self.registration.showNotification(title || 'Notification', options))
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
	event.notification.close()

	const urlToOpen = event.notification.data?.url || '/'

	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			// Check if window already open
			for (let i = 0; i < clientList.length; i++) {
				if (clientList[i].url === urlToOpen && 'focus' in clientList[i]) {
					return clientList[i].focus()
				}
			}
			// If not open, open new window
			if (clients.openWindow) {
				return clients.openWindow(urlToOpen)
			}
		})
	)
})

// Standard service worker install
self.addEventListener('install', (event) => {
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim())
})
