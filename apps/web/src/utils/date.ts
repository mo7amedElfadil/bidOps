export function normalizeDateInput(value?: string) {
	if (!value) return ''
	const trimmed = value.trim()
	if (!trimmed) return ''
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
	return trimmed
}
