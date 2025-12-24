import { chromium, Page } from 'playwright'
import { BaseTenderAdapter, TenderListingRecord } from './base.js'
import { translateIfArabic } from '../utils/translate.js'

export class MonaqasatAvailableAdapter extends BaseTenderAdapter {
	id = 'monaqasat_available'
	label = 'Monaqasat Available Tenders'
	portalUrl = process.env.MONAQASAT_PORTAL_URL || 'https://monaqasat.mof.gov.qa'

	async run(): Promise<TenderListingRecord[]> {
		console.log(`[${this.id}] Starting collection from ${this.portalUrl}...`)
		const browser = await chromium.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		})
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			locale: 'en-US',
			extraHTTPHeaders: {
				'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.7,ar;q=0.5'
			}
		})
		await context.addCookies([
			{
				name: '.AspNetCore.Culture',
				value: 'c=en|uic=en',
				domain: 'monaqasat.mof.gov.qa',
				path: '/',
				httpOnly: true,
				secure: true
			}
		])
		const page = await context.newPage()
		const records: TenderListingRecord[] = []
		const perRowDelay = Number(process.env.MONAQASAT_DELAY_MS ?? process.env.COLLECTOR_RATE_LIMIT_MS ?? 800)
		const maxPages = Number(process.env.MONAQASAT_TENDER_MAX_PAGES ?? process.env.MONAQASAT_MAX_PAGES ?? 10)
		const fromDate = this.parseFilterDate(process.env.MONAQASAT_TENDER_FROM_DATE)
		const toDate = this.parseFilterDate(process.env.MONAQASAT_TENDER_TO_DATE, true)

		try {
			const availablePath =
				process.env.MONAQASAT_AVAILABLE_PATH || '/TendersOnlineServices/AvailableMinistriesTenders/1'
			await this.ensureEnglish(page)
			let pageNum = 1
			let stop = false

				while (!stop && pageNum <= maxPages) {
					const availableUrl = this.buildPagedUrl(availablePath, pageNum)
					await this.ensureEnglish(page)
					await page.goto(availableUrl, { waitUntil: 'networkidle', timeout: 30000 })
				await page.waitForSelector('.custom-cards, .custom--table', { timeout: 15000 }).catch(() => {
					console.warn(`[${this.id}] Available tenders table not found (page ${pageNum})`)
				})

				let cards = await page.$$('.custom-cards')
				if (cards.length === 0) {
					cards = await page.$$('.custom--table .custom-cards')
				}
				if (cards.length === 0) {
					console.warn(`[${this.id}] No tender cards found on page ${pageNum}, stopping`)
					break
				}

				let pageMaxDate: Date | null = null

				for (const card of cards) {
				const summary = await card.evaluate(el => {
					const text = (node: Element | null | undefined) => node?.textContent?.trim() || ''
					const normalize = (value: string) => value.trim().toLowerCase()
					const matches = (value: string, targets: string[]) =>
						targets.some(target => normalize(value).includes(target))
					const findRowValue = (labels: string[]) => {
						const rows = Array.from(el.querySelectorAll('.cards-row'))
						for (const row of rows) {
							const labelText = text(row.querySelector('.card-label'))
							if (!labelText) continue
							if (matches(labelText, labels)) {
								return text(row.querySelector('.card-title'))
							}
						}
						return ''
					}

					const tenderRef = text(el.querySelector('.col-md-7 .col-header .card-label'))
					const titleAnchor = el.querySelector('.col-md-7 .col-header .card-title a') as HTMLAnchorElement | null
					const title = text(titleAnchor)
					const tenderHref = titleAnchor?.getAttribute('href') || ''
					const publishDateText = findRowValue(['publish date', 'opendate', 'تاريخ النشر'])
					const requestedSectorType = findRowValue(['requested sector type', 'sector', 'القطاع المطلوب'])
					const tenderBondText = findRowValue(['tender bond', 'bond', 'قيمة الضمان'])
					const documentsValueText = findRowValue(['documents value', 'document value', 'قيمة المستندات'])

					let ministry = ''
					const ministryLabel = text(el.querySelector('.col-md-3 .col-header .card-label'))
					if (ministryLabel && matches(ministryLabel, ['ministry', 'الجهة'])) {
						ministry = text(el.querySelector('.col-md-3 .col-header .card-title'))
					}
					const tenderType = findRowValue(['type', 'نوع العطاء'])

						const closeLabel = el.querySelector('.circle-container .card-label')
						let closeDateText = ''
						if (closeLabel) {
							const spans = Array.from(closeLabel.querySelectorAll('span'))
							if (spans.length >= 2) {
								closeDateText = text(spans[1])
							}
						}

						return {
							tenderRef,
							title,
							tenderHref,
							publishDateText,
							requestedSectorType,
							tenderBondText,
							documentsValueText,
							ministry,
							tenderType,
							closeDateText
						}
					})

					if (!summary.tenderRef && !summary.title) continue

					const publishDate = this.parseDate(summary.publishDateText)
					const closeDate = this.parseDate(summary.closeDateText)
					const candidate = closeDate ?? publishDate
					if (candidate) {
						const candidateDay = this.startOfDay(candidate)
						pageMaxDate =
							!pageMaxDate || candidateDay.getTime() > pageMaxDate.getTime() ? candidateDay : pageMaxDate

						if (fromDate && candidateDay < fromDate) {
							await this.delay(perRowDelay)
							continue
						}
						if (toDate && candidateDay > toDate) {
							await this.delay(perRowDelay)
							continue
						}
					}

					const translated = await translateIfArabic(summary.title)

					records.push({
						portal: 'monaqasat',
						tenderRef: summary.tenderRef || summary.title,
						title: translated.translated || summary.title,
						titleOriginal: translated.original,
						ministry: summary.ministry || undefined,
						publishDate,
						closeDate,
						requestedSectorType: summary.requestedSectorType || undefined,
						tenderBondValue: this.parseValue(this.normalizeDigits(summary.tenderBondText)),
						documentsValue: this.parseValue(this.normalizeDigits(summary.documentsValueText)),
						tenderType: summary.tenderType || undefined,
						purchaseUrl: summary.tenderHref
							? new URL(summary.tenderHref, this.portalUrl).toString()
							: undefined,
						sourceUrl: summary.tenderHref ? new URL(summary.tenderHref, this.portalUrl).toString() : undefined
					})

					await this.delay(perRowDelay)
				}

				if (fromDate && pageMaxDate && pageMaxDate.getTime() < fromDate.getTime()) {
					console.log(`[${this.id}] Reached tenders older than fromDate on page ${pageNum}, stopping`)
					break
				}

				pageNum += 1
			}
		} catch (e) {
			console.error(`[${this.id}] Error scraping:`, e)
		} finally {
			await browser.close()
		}

		const filtered = this.filterByDateRange(records)
		console.log(`[${this.id}] Collected ${filtered.length} tenders (filtered ${records.length} total)`)
		return filtered
	}

	private normalizeDigits(value: string): string {
		const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
		return value.replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)))
	}

	private startOfDay(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate())
	}

	private filterByDateRange(records: TenderListingRecord[]) {
		const from = this.parseFilterDate(process.env.MONAQASAT_TENDER_FROM_DATE)
		const to = this.parseFilterDate(process.env.MONAQASAT_TENDER_TO_DATE, true)
		if (!from && !to) return records
		return records.filter(record => {
			const candidate = record.publishDate ?? record.closeDate
			if (!candidate) return true
			if (from && candidate < from) return false
			if (to && candidate > to) return false
			return true
		})
	}

	private buildPagedUrl(path: string, pageNum: number): string {
		const normalized = path.replace(/\/\d+$/, '')
		return new URL(`${normalized}/${pageNum}`, this.portalUrl).toString()
	}

	private async ensureEnglish(page: Page) {
		const changeLangUrl = new URL('/Main/ChangeLang?returnURL=%2F', this.portalUrl).toString()
		try {
			await page.goto(changeLangUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
			await page.waitForTimeout(500)
		} catch (err: any) {
			console.warn(`[${this.id}] English switch skipped: ${err.message || err}`)
		}
	}

	private parseFilterDate(value?: string, endOfDay = false): Date | undefined {
		if (!value) return undefined
		const parsed = new Date(value)
		if (Number.isNaN(parsed.getTime())) return undefined
		if (endOfDay) {
			parsed.setHours(23, 59, 59, 999)
		}
		return parsed
	}

	private parseDate(value?: string): Date | undefined {
		if (!value) return undefined
		const normalized = this.normalizeDigits(value)
		const parts = normalized.trim().split('/')
		if (parts.length !== 3) return undefined
		const [day, month, year] = parts.map(p => Number(p))
		if (!day || !month || !year) return undefined
		return new Date(year, month - 1, day)
	}
}
