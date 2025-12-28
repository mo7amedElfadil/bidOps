import { NotificationChannel, NotificationDigestMode } from '../api/client'

export const notificationActivities = [
	{ value: 'opportunity.created', label: 'Opportunity created' },
	{ value: 'review.requested', label: 'Review requested' },
	{ value: 'change-request.created', label: 'Change request submitted' },
	{ value: 'approval.decision', label: 'Approval decisions' },
	{ value: 'approval.finalized', label: 'Bid finalized' },
	{ value: 'auth.signup', label: 'Access requests' },
	{ value: 'auth.signup.pending', label: 'Signup pending' },
	{ value: 'sla', label: 'SLA reminders' }
] as const

export const channelLabels: Record<NotificationChannel, string> = {
	EMAIL: 'Email',
	IN_APP: 'In-app'
}

export const digestOptions: Array<{ value: NotificationDigestMode; label: string }> = [
	{ value: 'INSTANT', label: 'Instant' },
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'WEEKLY', label: 'Weekly' },
	{ value: 'OFF', label: 'Off' }
]
