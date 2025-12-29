/**
 * Base interface for all award source adapters.
 * Each adapter collects award data from a specific portal.
 */
export interface AwardRecord {
	portal: string
	tenderRef: string
	client: string
	title: string
	titleOriginal?: string
	closeDate?: Date
	awardDate?: Date
	winners: string[]
	awardValue?: number
	currency?: string
	codes?: string[]
	sourceUrl?: string
	rawHtml?: string
}

export interface SourceAdapter {
	/** Unique identifier for this adapter */
	id: string
	/** Human-readable name */
	label: string
	/** Portal URL */
	portalUrl: string
	/** Check if adapter is enabled and portal is reachable */
	isEnabled: () => Promise<boolean>
	/** Run the collector and return awards found */
	run: () => Promise<AwardRecord[]>
}

/**
 * Abstract base class with common functionality
 */
export abstract class BaseAdapter implements SourceAdapter {
	abstract id: string
	abstract label: string
	abstract portalUrl: string

	async isEnabled(): Promise<boolean> {
		// Check if the adapter is enabled via environment variable
		const envKey = `COLLECTOR_${this.id.toUpperCase()}_ENABLED`
		const enabled = process.env[envKey] !== 'false'
		return enabled
	}

	abstract run(): Promise<AwardRecord[]>

	/**
	 * Utility to add delay between requests (respect rate limits)
	 */
	protected async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Parse monetary value from string (handles various formats)
	 */
	protected parseValue(text: string): number | undefined {
		if (!text) return undefined
		// Remove currency symbols and whitespace
		const cleaned = text.replace(/[^\d.,]/g, '').replace(/,/g, '')
		const val = parseFloat(cleaned)
		return isNaN(val) ? undefined : val
	}

	/**
	 * Normalize company name for matching
	 */
	protected normalizeCompanyName(name: string): string {
		return name
			.toLowerCase()
			.replace(/[.,]/g, '')
			.replace(/\b(llc|inc|corp|ltd|co|company|limited)\b/gi, '')
			.replace(/\s+/g, ' ')
			.trim()
	}
}
