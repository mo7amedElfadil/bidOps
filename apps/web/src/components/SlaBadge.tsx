export function SlaBadge({ daysLeft }: { daysLeft?: number }) {
	if (daysLeft === undefined || daysLeft === null) return null
	let color = 'bg-gray-200 text-gray-800'
	if (daysLeft <= 1) color = 'bg-red-100 text-red-800'
	else if (daysLeft <= 3) color = 'bg-amber-100 text-amber-800'
	else if (daysLeft <= 7) color = 'bg-yellow-100 text-yellow-800'
	return <span className={`inline-block rounded px-2 py-0.5 text-xs ${color}`}>{daysLeft}d</span>
}


