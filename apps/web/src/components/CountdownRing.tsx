import React from 'react'

function formatCountdown(ms: number) {
	const totalMinutes = Math.max(0, Math.floor(ms / 60000))
	const days = Math.floor(totalMinutes / (24 * 60))
	const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
	const minutes = totalMinutes % 60
	return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function getColor(daysLeft: number) {
	if (daysLeft > 7) return '#16a34a'
	if (daysLeft > 3) return '#facc15'
	if (daysLeft > 1) return '#f97316'
	return '#ef4444'
}

export default function CountdownRing({
	submissionDate,
	now
}: {
	submissionDate?: string
	now: number
}) {
	if (!submissionDate) return <span className="text-xs text-slate-500">—</span>
	const target = new Date(submissionDate).getTime()
	const diff = target - now
	const daysLeft = diff / (1000 * 60 * 60 * 24)
	const color = getColor(daysLeft)

	const thresholdMs = 7 * 24 * 60 * 60 * 1000
	const percent = Math.max(0, Math.min(100, (diff / thresholdMs) * 100))
	const radius = 14
	const circumference = 2 * Math.PI * radius
	const dash = (percent / 100) * circumference

	const label = diff <= 0 ? '00:00:00' : formatCountdown(diff)

	return (
		<div className="flex items-center gap-2">
			<svg width="36" height="36" className="shrink-0">
				<circle cx="18" cy="18" r={radius} stroke="#e2e8f0" strokeWidth="4" fill="none" />
				<circle
					cx="18"
					cy="18"
					r={radius}
					stroke={color}
					strokeWidth="4"
					fill="none"
					strokeDasharray={`${dash} ${circumference}`}
					transform="rotate(-90 18 18)"
					strokeLinecap="round"
				/>
			</svg>
			<span className="text-xs font-medium text-slate-700">{label}</span>
		</div>
	)
}
