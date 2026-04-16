'use client'

import { useEffect } from 'react'

export default function PwaInstaller() {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js')
				.then((registration) => {
					console.log('Service Worker registered successfully:', registration)
				})
				.catch((error) => {
					console.log('Service Worker registration failed:', error)
				})
		}
	}, [])

	return null
}
