import { describe, it, expect } from 'vitest'

function classify(days: number, warn = 7, alert = 3, urgent = 1): 'none'|'warn'|'alert'|'urgent' {
	if (days <= urgent) return 'urgent'
	if (days <= alert) return 'alert'
	if (days <= warn) return 'warn'
	return 'none'
}

describe('SLA classification', () => {
	it('classifies thresholds', () => {
		expect(classify(10)).toBe('none')
		expect(classify(7)).toBe('warn')
		expect(classify(3)).toBe('alert')
		expect(classify(1)).toBe('urgent')
	})
})


