import type { NotificationItem } from '../api/client'

type NotificationLink = {
	href: string
	external: boolean
}

export function getNotificationLink(note: NotificationItem): NotificationLink | null {
	const payloadUrl = (note.payload as { actionUrl?: unknown } | undefined)?.actionUrl
	if (typeof payloadUrl === 'string' && payloadUrl.trim()) {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'
		try {
			const url = new URL(payloadUrl, origin)
			if (url.origin === origin) {
				return { href: `${url.pathname}${url.search}${url.hash}`, external: false }
			}
			return { href: payloadUrl, external: true }
		} catch {
			return { href: payloadUrl, external: payloadUrl.startsWith('http') }
		}
	}
	if (note.opportunityId) {
		return { href: `/opportunity/${note.opportunityId}`, external: false }
	}
	return null
}
