import { chromium } from 'playwright'
import { BaseAdapter, AwardRecord } from './base.js'

export class MonaqasatAdapter extends BaseAdapter {
	id = 'monaqasat'
	label = 'Monaqasat (MoF)'
	portalUrl = 'http://monaqasat.mof.gov.qa/'

	async run(): Promise<AwardRecord[]> {
		console.log(`[${this.id}] Starting collection from ${this.portalUrl}...`)
		const browser = await chromium.launch({ headless: true })
		const page = await browser.newPage()
		const records: AwardRecord[] = []

		try {
			// Note: This target URL might be flaky or require VPN. 
			// We wrap in try-catch to allow partial success or mock data in dev.
			await page.goto(this.portalUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => {
                console.warn(`[${this.id}] Failed to load page: ${e.message}`)
            })
			
			const pageTitle = await page.title().catch(() => 'Unknown')
			console.log(`[${this.id}] Connected to: ${pageTitle}`)

            // For now, we simulate finding results because we can't guarantee access to the gov portal from this env
            // TODO: Replace with real selectors once site structure is confirmed
            const mockTenders = [
                { text: 'Supply of Oracle Licenses', ref: 'M-101', title: 'Oracle Licensing', date: new Date() },
                { text: 'Construction of new road', ref: 'C-202', title: 'Road Construction', date: new Date() },
				{ text: 'Cloud Migration Services for Govt Agency', ref: 'IT-303', title: 'Cloud Migration', date: new Date() }
            ]

            for (const t of mockTenders) {
                if (await this.isRelevant(t.text)) {
                    records.push({
                        portal: this.id,
                        tenderRef: t.ref,
                        title: t.title,
                        buyer: 'MoF',
                        closeDate: t.date,
                        winners: [],
                         // Pending award
                    })
                } else {
                    console.log(`[${this.id}] Skipped irrelevant: ${t.title}`)
                }
            }

		} catch (e) {
			console.error(`[${this.id}] Error scraping:`, e)
		} finally {
			await browser.close()
		}

		return records
	}

	private async isRelevant(text: string): Promise<boolean> {
        // AI-driven relevance check
        if (process.env.OPENAI_API_KEY) {
            return this.checkWithOpenAI(text)
        }
		if (process.env.GEMINI_API_KEY) {
			return this.checkWithGemini(text)
		}

		// Fallback: keyword matching
		const keywords = ['software', 'cloud', 'security', 'network', 'mobile', 'oracle', 'license']
		return keywords.some(k => text.toLowerCase().includes(k))
	}

    private async checkWithOpenAI(text: string): Promise<boolean> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a tender analyst. Relevant sectors: IT, Software, Cloud, Security.' },
                        { role: 'user', content: `Is this tender relevant? Text: ${text.substring(0, 500)}. Reply with YES or NO.` }
                    ]
                })
            })
            const data = await response.json()
			// @ts-ignore
            return data.choices?.[0]?.message?.content?.toUpperCase().includes('YES') || false
        } catch (e) {
            console.error('OpenAI check failed', e)
            return true // Fail safe
        }
    }

	private async checkWithGemini(text: string): Promise<boolean> {
		// Placeholder for Gemini implementation
		return true
	}
}
