import { chromium, Page } from 'playwright'
import { BaseAdapter, AwardRecord } from './base.js'
import { translateIfArabic } from '../utils/translate.js'

export class MonaqasatAdapter extends BaseAdapter {
	id = 'monaqasat'
	label = 'Monaqasat (MoF)'
	portalUrl = process.env.MONAQASAT_PORTAL_URL || 'https://monaqasat.mof.gov.qa'

	async run(): Promise<AwardRecord[]> {
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
		const records: AwardRecord[] = []
		const perRowDelay = Number(process.env.MONAQASAT_DELAY_MS ?? process.env.COLLECTOR_RATE_LIMIT_MS ?? 800)
		const maxPages = Number(process.env.MONAQASAT_MAX_PAGES ?? 10)

		try {
			const fromDate = this.parseIsoDate(process.env.MONAQASAT_FROM_DATE || '')
			const toDate = this.parseIsoDate(process.env.MONAQASAT_TO_DATE || '')
			const awardedPath = process.env.MONAQASAT_AWARDED_PATH || '/TendersOnlineServices/AwardedTenders/1'
			const detailPage = await context.newPage()

			await this.ensureEnglish(page)
			await this.ensureEnglish(detailPage)
			let pageNum = 1
			while (pageNum <= maxPages) {
				const awardedUrl = this.buildPagedUrl(awardedPath, pageNum)
				await page.goto(awardedUrl, { waitUntil: 'networkidle', timeout: 30000 })
				await page.waitForSelector('.custom-cards, .custom--table', { timeout: 15000 }).catch(() => {
					console.warn(`[${this.id}] Awarded tenders table not found (page ${pageNum})`)
				})

				let cards = await page.$$('.custom-cards')
				if (cards.length === 0) {
					cards = await page.$$('.custom--table .custom-cards')
				}
				if (cards.length === 0) {
					console.warn(`[${this.id}] No cards found on page ${pageNum}, stopping`)
					break
				}

				let pageMinDate: Date | null = null
				let pageMaxDate: Date | null = null

				for (const card of cards) {
					const summary = await card.evaluate(el => {
						const text = (node: Element | null | undefined) => node?.textContent?.trim() || ''
						const findRowValue = (label: string) => {
							const rows = Array.from(el.querySelectorAll('.cards-row'))
						for (const row of rows) {
							const labelText = text(row.querySelector('.card-label'))
							if (labelText.includes(label)) {
								return text(row.querySelector('.card-title'))
							}
						}
						return ''
					}

					const tenderRef = text(el.querySelector('.col-header .card-label label'))
					const titleAnchor = el.querySelector('.col-header .card-title a') as HTMLAnchorElement | null
					const title = text(titleAnchor)
					const tenderHref = titleAnchor?.getAttribute('href') || ''
					const awardDateText =
						findRowValue('تاريخ الترسية') ||
						findRowValue('Award date') ||
						findRowValue('Awarded Date')

					let client = ''
					const buyerCol = el.querySelector('.col-md-3.cards-col')
					const buyerLabel = text(buyerCol?.querySelector('.col-header .card-label'))
					if (buyerLabel.includes('الجهة') || buyerLabel.includes('Entity') || buyerLabel.includes('Ministry')) {
						client = text(buyerCol?.querySelector('.col-header .card-title'))
					}

					const reportAnchor = el.querySelector('a[href*="TenderCompaniesDetails"]') as HTMLAnchorElement | null
					const reportHref = reportAnchor?.getAttribute('href') || ''

					return { tenderRef, title, tenderHref, awardDateText, client, reportHref }
					})

					if (!summary.tenderRef && !summary.title) continue

					const detailUrl = summary.reportHref ? new URL(summary.reportHref, this.portalUrl).toString() : ''
					let awardValue: number | undefined
					let awardDate = this.parseDate(summary.awardDateText)
					let winners: string[] = []
					let codes: string[] = []

					if (detailUrl) {
						await this.ensureEnglish(detailPage)
						const detail = await this.parseTenderDetails(detailPage, detailUrl)
						if (detail.awardValue) awardValue = detail.awardValue
						if (detail.awardDate) awardDate = detail.awardDate
						if (detail.winners.length) winners = detail.winners
						if (detail.codes.length) codes = detail.codes
						if (!summary.client && detail.buyer) {
							summary.client = detail.buyer
						}
					}

					if (awardDate) {
						const awardDay = this.startOfDay(awardDate)
						pageMinDate =
							!pageMinDate || awardDay.getTime() < pageMinDate.getTime() ? awardDay : pageMinDate
						pageMaxDate =
							!pageMaxDate || awardDay.getTime() > pageMaxDate.getTime() ? awardDay : pageMaxDate

						if (fromDate && awardDay < fromDate) {
							await this.delay(perRowDelay)
							continue
						}
						if (toDate && awardDay > toDate) {
							await this.delay(perRowDelay)
							continue
						}
					}

					const translated = await translateIfArabic(summary.title)

					records.push({
						portal: this.id,
						tenderRef: summary.tenderRef || summary.title,
						client: summary.client || 'Unknown',
						title: translated.translated || summary.title,
						titleOriginal: translated.original,
						awardDate: awardDate ?? undefined,
						winners,
						awardValue,
						codes,
						currency: 'QAR',
						sourceUrl:
							detailUrl || (summary.tenderHref ? new URL(summary.tenderHref, this.portalUrl).toString() : undefined)
					})

					await this.delay(perRowDelay)
				}

				if (fromDate && pageMaxDate && pageMaxDate.getTime() < fromDate.getTime()) {
					console.log(`[${this.id}] Reached awards older than fromDate on page ${pageNum}, stopping`)
					break
				}

				pageNum += 1
			}

			await detailPage.close()
		} catch (e) {
			console.error(`[${this.id}] Error scraping:`, e)
		} finally {
			await browser.close()
		}

		console.log(`[${this.id}] Collected ${records.length} awards`)
		return records
	}

	private normalizeDigits(value: string): string {
		const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
		return value.replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)))
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

	private parseIsoDate(value?: string): Date | undefined {
		if (!value) return undefined
		const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
		if (!match) return undefined
		const year = Number(match[1])
		const month = Number(match[2])
		const day = Number(match[3])
		return new Date(year, month - 1, day)
	}

	private startOfDay(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate())
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

	private buildPagedUrl(path: string, pageNum: number): string {
		const normalized = path.replace(/\/\d+$/, '')
		return new URL(`${normalized}/${pageNum}`, this.portalUrl).toString()
	}

	private async parseTenderDetails(page: Page, detailUrl: string) {
		await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
		const result = await page.evaluate(() => {
			const text = (node: Element | null | undefined) => node?.textContent?.trim() || ''
			const normalize = (value: string) => value.replace(/\s+/g, ' ').toLowerCase()
			const matches = (value: string, keywords: string[]) =>
				keywords.some(keyword => normalize(value).includes(keyword))
			const findLabelValue = (keywords: string[]) => {
				const rows = Array.from(document.querySelectorAll('tr, .cards-row, .row'))
				for (const row of rows) {
					const label = text(row.querySelector('.card-label, .label, th'))
					if (!label) continue
					if (matches(label, keywords)) {
						const target =
							row.querySelector('.card-title, td:last-child, .value, .col-md-8') ||
							row.querySelector('td:nth-child(2)') ||
							row.querySelector('span')
						if (target) return text(target)
					}
				}
				return ''
			}
			const awardDateText = text(document.querySelector('#lblAwardedDate'))
			const awardValueText = text(document.querySelector('#lbl_award'))
			const buyer = text(document.querySelector('#lblRequesterEntity'))
			const codesText = findLabelValue(['code', 'activity code', 'business activity', 'classification', 'النشاط'])

			const winners: string[] = []
			const headers = Array.from(document.querySelectorAll('h3'))
			const target = headers.find(h => {
				const value = h.textContent || ''
				return value.includes('بيانات الشركات التي تم الترسية عليها') || value.includes('Awarded companies data')
			})
			const table = target?.nextElementSibling?.querySelector('table')
			if (table) {
				for (const row of Array.from(table.querySelectorAll('tbody tr'))) {
					const name = text(row.querySelector('td'))
					if (name) winners.push(name)
				}
			}

			return { awardDateText, awardValueText, winners, buyer, codesText }
		})

		const parsedCodes = (result.codesText || '')
			.split(/[;,]/)
			.map(part => part.trim())
			.filter(Boolean)
		return {
			awardDate: this.parseDate(result.awardDateText),
			awardValue: this.parseValue(this.normalizeDigits(result.awardValueText)),
			winners: Array.from(new Set(result.winners)),
			buyer: result.buyer,
			codes: parsedCodes
		}
	}
}
