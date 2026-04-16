'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePushNotifications } from '@/lib/usePushNotifications'
import { Bell } from 'lucide-react'

export default function PushNotificationPrompt() {
	const { isLoaded, isSignedIn, user } = useUser()
	const { isSupported, isSubscribed, subscribeToNotifications } =
		usePushNotifications()
	const [showPrompt, setShowPrompt] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (!isLoaded || !isSignedIn || !user?.id) {
			setShowPrompt(false)
			return
		}

		const storageKey = `pg-push-consent-v1-${user.id}`
		const savedDecision = window.localStorage.getItem(storageKey)
		setShowPrompt(!savedDecision)
	}, [isLoaded, isSignedIn, user?.id])

	if (!isLoaded || !isSignedIn || !showPrompt) return null

	const handleEnable = async () => {
		setIsLoading(true)
		try {
			if (isSupported) {
				await subscribeToNotifications()
			}
		} finally {
			if (user?.id) {
				window.localStorage.setItem(`pg-push-consent-v1-${user.id}`, 'accepted')
			}
			setShowPrompt(false)
			setIsLoading(false)
		}
	}

	const handleDismiss = () => {
		if (user?.id) {
			window.localStorage.setItem(`pg-push-consent-v1-${user.id}`, 'rejected')
		}
		setShowPrompt(false)
	}

	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
			<div className="w-full max-w-lg border-2 border-black bg-surface p-6 shadow-[14px_14px_0_0_rgba(0,0,0,1)] sm:p-8">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 border-black bg-primary text-black">
						<Bell className="h-5 w-5" />
					</div>
					<div className="space-y-3">
						<p className="font-ibm-mono text-[10px] uppercase tracking-[0.35em] text-textMuted">
							Notifications
						</p>
						<h2 className="font-anton text-4xl uppercase leading-none sm:text-5xl">
							Stay ahead of expiry.
						</h2>
						<p className="max-w-md font-ibm-mono text-sm uppercase leading-6 tracking-[0.12em] text-textMuted">
							Choose now to continue. Enable push alerts for expiring items and recipe suggestions, or dismiss this for now.
						</p>
					</div>
				</div>

				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<button
						onClick={handleEnable}
						disabled={isLoading}
						className="border-2 border-black bg-primary px-5 py-4 font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
					>
						{isLoading ? 'Enabling...' : 'Enable notifications'}
					</button>
					<button
						onClick={handleDismiss}
						disabled={isLoading}
						className="border-2 border-black bg-background px-5 py-4 font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-textMain shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
					>
						Not now
					</button>
				</div>
			</div>
		</div>
	)
}
