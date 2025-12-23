export interface TenderListingRecord {
	portal: string
	tenderRef?: string
	title?: string
	ministry?: string
	publishDate?: Date
	closeDate?: Date
	requestedSectorType?: string
	tenderBondValue?: number
	documentsValue?: number
	tenderType?: string
	purchaseUrl?: string
	sourceUrl?: string
}

export interface TenderSourceAdapter {
	id: string
	label: string
	portalUrl: string
	isEnabled: () => Promise<boolean>
	run: () => Promise<TenderListingRecord[]>
}

export abstract class BaseTenderAdapter implements TenderSourceAdapter {
	abstract id: string
	abstract label: string
	abstract portalUrl: string

	async isEnabled(): Promise<boolean> {
		const envKey = `COLLECTOR_${this.id.toUpperCase()}_ENABLED`
		const enabled = process.env[envKey] !== 'false'
		return enabled
	}

	abstract run(): Promise<TenderListingRecord[]>

	protected async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	protected parseValue(text: string): number | undefined {
		if (!text) return undefined
		const cleaned = text.replace(/[^\d.,]/g, '').replace(/,/g, '')
		const val = parseFloat(cleaned)
		return isNaN(val) ? undefined : val
	}
}
