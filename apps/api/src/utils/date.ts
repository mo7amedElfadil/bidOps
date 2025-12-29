export function normalizeDateInput(value?: string): string | undefined {
	if (!value) return undefined
	const trimmed = value.trim()
	if (!trimmed) return undefined
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
	if (trimmed.includes('/')) {
		const parts = trimmed.split('/').map(part => part.trim())
		if (parts.length === 3) {
			let [day, month, year] = parts
			if (year.length === 2) year = `20${year}`
			if (year.length === 4) {
				const dd = day.padStart(2, '0')
				const mm = month.padStart(2, '0')
				return `${year}-${mm}-${dd}`
			}
		}
	}
	return undefined
}

export function parseDateInput(value?: string, endOfDay = false): Date | undefined {
	const normalized = normalizeDateInput(value)
	if (!normalized) return undefined
	const [year, month, day] = normalized.split('-').map(Number)
	if (!year || !month || !day) return undefined
	const date = new Date(year, month - 1, day)
	if (endOfDay) {
		date.setHours(23, 59, 59, 999)
	}
	return date
}
