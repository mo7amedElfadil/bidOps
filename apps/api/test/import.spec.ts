import { describe, it, expect } from 'vitest'

function mapHeaders(headers: string[]) {
	return {
		client: headers.includes('Customer'),
		title: headers.includes('Description') || headers.includes('Tender Details'),
		submissionDate: headers.includes('Submission Date')
	}
}

describe('Tracker import header mapping', () => {
	it('detects key fields', () => {
		const res = mapHeaders([
			'Customer',
			'Tender Details',
			'Description',
			'Submission Date',
			'Status'
		])
		expect(res.client).toBe(true)
		expect(res.title).toBe(true)
		expect(res.submissionDate).toBe(true)
	})
})


