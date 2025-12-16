/**
 * Qatar Government Procurement Portal Adapter
 *
 * This adapter collects award results from the Qatar Government
 * e-procurement portal.
 *
 * NOTE: This is a template implementation. Before using:
 * 1. Verify ToS compliance for the target portal
 * 2. Implement proper error handling
 * 3. Add rate limiting as per portal requirements
 * 4. Update selectors based on actual page structure
 */

import { chromium, Browser, Page } from 'playwright'
import { BaseAdapter, AwardRecord } from './base.js'

export class QatarGovAdapter extends BaseAdapter {
	id = 'qatar-gov'
	label = 'Qatar Government e-Procurement'
	portalUrl = process.env.QATAR_GOV_PORTAL_URL || 'https://www.tawteen.gov.qa' // placeholder

	private browser: Browser | null = null

	async isEnabled(): Promise<boolean> {
		// Check base enablement
		const baseEnabled = await super.isEnabled()
		if (!baseEnabled) return false

		// Additional checks can go here
		// e.g., check if portal is reachable
		return true
	}

	async run(): Promise<AwardRecord[]> {
		console.log(`[${this.id}] Starting collection from ${this.portalUrl}...`)
		const awards: AwardRecord[] = []

		try {
			this.browser = await chromium.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox']
			})

			const context = await this.browser.newContext({
				userAgent:
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			})

			const page = await context.newPage()
			const perRowDelay = Number(process.env.QATAR_GOV_DELAY_MS ?? process.env.COLLECTOR_RATE_LIMIT_MS ?? 800)

		// Navigate to awards listing page
		// TODO: replace with actual awards page URL/path
		const awardsUrl = process.env.QATAR_GOV_AWARDS_PATH
			? `${this.portalUrl}${process.env.QATAR_GOV_AWARDS_PATH}`
			: `${this.portalUrl}/en/awards`
		console.log(`[${this.id}] Navigating to ${awardsUrl}`)

		await page.goto(awardsUrl, { waitUntil: 'networkidle', timeout: 30000 })

		// Wait for content to load
		await page.waitForSelector('table, .award-list, .results-table, #awards-container', {
			timeout: 15000
		}).catch(() => {
			console.log(`[${this.id}] Award container not found, page may have different structure`)
		})

		// Extract awards from the page
		// NOTE: Update selectors based on actual page structure
		const awardElements = await page.$$('.award-item, .result-row, tr')

			for (const element of awardElements) {
				try {
					const award = await this.parseAwardElement(page, element)
					if (award) {
						awards.push(award)
					}
				} catch (err) {
					console.error(`[${this.id}] Error parsing award element:`, err)
				}

				// Respect rate limits
				await this.delay(perRowDelay)
			}

			// Handle pagination if present
			// NOTE: Implement pagination logic based on portal structure
			// let hasMore = true
			// while (hasMore) {
			//   const nextButton = await page.$('.pagination .next:not(.disabled)')
			//   if (nextButton) {
			//     await nextButton.click()
			//     await page.waitForLoadState('networkidle')
			//     // Extract more awards...
			//   } else {
			//     hasMore = false
			//   }
			// }
		} catch (err) {
			console.error(`[${this.id}] Collection error:`, err)
		} finally {
			if (this.browser) {
				await this.browser.close()
				this.browser = null
			}
		}

		console.log(`[${this.id}] Collected ${awards.length} awards`)
		return awards
	}

	/**
	 * Parse a single award element from the page
	 * NOTE: Update selectors based on actual page structure
	 */
	private async parseAwardElement(page: Page, element: any): Promise<AwardRecord | null> {
		try {
			// Extract tender reference
			const tenderRef = await element.$eval(
				'.tender-ref, .reference-number, [data-field="ref"], td:nth-child(1)',
				(el: Element) => el.textContent?.trim() || ''
			).catch(() => '')

			if (!tenderRef) return null

			// Extract buyer/organization
			const buyer = await element.$eval(
				'.buyer, .organization, [data-field="buyer"], td:nth-child(2)',
				(el: Element) => el.textContent?.trim() || ''
			).catch(() => 'Unknown')

			// Extract title
			const title = await element.$eval(
				'.title, .tender-title, [data-field="title"], td:nth-child(3)',
				(el: Element) => el.textContent?.trim() || ''
			).catch(() => '')

			// Extract award date
			const dateText = await element.$eval(
				'.award-date, .date, [data-field="date"]',
				(el: Element) => el.textContent?.trim() || ''
			).catch(() => '')
			const awardDate = dateText ? new Date(dateText) : new Date()

			// Extract winners
			const winnersText = await element.$eval(
				'.winner, .awarded-to, [data-field="winner"], td:nth-child(5)',
				(el: Element) => el.textContent?.trim() || ''
			).catch(() => '')
			const winners = winnersText ? winnersText.split(/[,;]/).map((w: string) => w.trim()).filter(Boolean) : []

			// Extract value
			const valueText = await element.$eval(
				'.value, .award-value, [data-field="value"], td:nth-child(6)',
				(el: Element) => el.textContent?.trim() || ''
			).catch(() => '')
			const awardValue = this.parseValue(valueText)

			// Extract detail URL
			const href = await element.$eval(
				'a.detail-link, a[href*="award"], a[href*="tender"], a',
				(el: Element) => (el as HTMLAnchorElement).href
			).catch(() => '')
			const sourceUrl = href || undefined

			return {
				portal: this.id,
				tenderRef,
				buyer,
				title,
				awardDate,
				winners,
				awardValue,
				currency: 'QAR',
				sourceUrl
			}
		} catch (err) {
			console.error(`[${this.id}] Parse error:`, err)
			return null
		}
	}
}

