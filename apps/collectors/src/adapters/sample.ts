/**
 * Sample Award Adapter
 *
 * This is a demonstration adapter that generates sample award data.
 * Use this as a template for implementing real portal adapters.
 */

import { BaseAdapter, AwardRecord } from './base.js'

export class SampleAdapter extends BaseAdapter {
	id = 'sample'
	label = 'Sample Awards Portal'
	portalUrl = 'https://example.com/awards'

	async run(): Promise<AwardRecord[]> {
		console.log(`[${this.id}] Starting collection...`)

		// In a real adapter, this would scrape a website using Playwright
		// For demo, we generate sample data

		const awards: AwardRecord[] = [
			{
				portal: this.id,
				tenderRef: `SAMPLE-${Date.now()}-001`,
				buyer: 'Ministry of Technology',
				title: 'IT Infrastructure Upgrade Project',
				awardDate: new Date(),
				winners: ['TechCorp Solutions LLC'],
				awardValue: 1250000,
				currency: 'QAR',
				codes: ['IT-001', 'INFRA-002'],
				sourceUrl: `${this.portalUrl}/award/001`
			},
			{
				portal: this.id,
				tenderRef: `SAMPLE-${Date.now()}-002`,
				buyer: 'Qatar University',
				title: 'Campus Network Modernization',
				awardDate: new Date(Date.now() - 86400000), // Yesterday
				winners: ['NetWorks Qatar', 'Cisco Partner LLC'],
				awardValue: 890000,
				currency: 'QAR',
				codes: ['EDU-001', 'NET-003'],
				sourceUrl: `${this.portalUrl}/award/002`
			},
			{
				portal: this.id,
				tenderRef: `SAMPLE-${Date.now()}-003`,
				buyer: 'Hamad Medical Corporation',
				title: 'Healthcare Management System',
				awardDate: new Date(Date.now() - 172800000), // 2 days ago
				winners: ['HealthTech Arabia'],
				awardValue: 2100000,
				currency: 'QAR',
				codes: ['HEALTH-001', 'SW-005'],
				sourceUrl: `${this.portalUrl}/award/003`
			}
		]

		console.log(`[${this.id}] Collected ${awards.length} awards`)
		return awards
	}
}

