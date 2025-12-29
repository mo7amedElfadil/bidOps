export type TenderScope = 'ITSQ' | 'IOT_SHABAKA' | 'OTHER'

export interface TenderActivityInput {
	id: string
	name: string
	scope: TenderScope
	keywords: string[]
	negativeKeywords?: string[]
	weight?: number | null
	isHighPriority?: boolean
	isActive?: boolean
}

export interface TenderRecordInput {
	title?: string | null
	titleOriginal?: string | null
	ministry?: string | null
	requestedSectorType?: string | null
	tenderType?: string | null
	createdAt?: Date | string | null
	closeDate?: Date | string | null
}

export interface TenderClassifierConfig {
	newWindowHours?: number
	highPriorityBonus?: number
	now?: Date
	scoring?: Partial<{
		titlePhrase: number
		titleKeyword: number
		detailPhrase: number
		detailKeyword: number
		negativePhrase: number
		negativeKeyword: number
	}>
}

export interface TenderClassificationResult {
	score: number
	isNew: boolean
	matchedActivityIds: string[]
	matchedScopes: TenderScope[]
	matchedKeywords: string[]
	reasons: string[]
}

const DEFAULT_SCORING = {
	titlePhrase: 25,
	titleKeyword: 12,
	detailPhrase: 12,
	detailKeyword: 5,
	negativePhrase: 40,
	negativeKeyword: 20
}

const DEFAULT_NEW_WINDOW_HOURS = 24
const DEFAULT_HIGH_PRIORITY_BONUS = 15

function normalizeText(input?: string | null): string {
	return (input || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function parseDate(input?: Date | string | null): Date | null {
	if (!input) return null
	return input instanceof Date ? input : new Date(input)
}

function isPhrase(keyword: string): boolean {
	return keyword.includes(' ')
}

function addReason(reasons: string[], reason: string) {
	if (reasons.length >= 20) return
	reasons.push(reason)
}

export function classifyTender(
	tender: TenderRecordInput,
	activities: TenderActivityInput[],
	config: TenderClassifierConfig = {}
): TenderClassificationResult {
	const scoring = { ...DEFAULT_SCORING, ...(config.scoring || {}) }
	const now = config.now || new Date()
	const newWindowHours = config.newWindowHours ?? DEFAULT_NEW_WINDOW_HOURS
	const highPriorityBonus = config.highPriorityBonus ?? DEFAULT_HIGH_PRIORITY_BONUS

	const titleText = normalizeText([tender.title, tender.titleOriginal].filter(Boolean).join(' '))
	const detailText = normalizeText(
		[tender.ministry, tender.requestedSectorType, tender.tenderType].filter(Boolean).join(' ')
	)

	let totalScore = 0
	const matchedActivityIds = new Set<string>()
	const matchedScopes = new Set<TenderScope>()
	const matchedKeywords = new Set<string>()
	const reasons: string[] = []

	for (const activity of activities) {
		if (activity.isActive === false) continue
		const weight = activity.weight ?? 1
		if (weight <= 0) continue

		let matched = false
		let activityScore = 0

		for (const keyword of activity.keywords || []) {
			const clean = normalizeText(keyword)
			if (!clean) continue

			const inTitle = titleText.includes(clean)
			const inDetail = !inTitle && detailText.includes(clean)
			if (!inTitle && !inDetail) continue

			const phrase = isPhrase(clean)
			let delta = 0
			if (inTitle) {
				delta = phrase ? scoring.titlePhrase : scoring.titleKeyword
			} else if (inDetail) {
				delta = phrase ? scoring.detailPhrase : scoring.detailKeyword
			}

			delta = Math.round(delta * weight)
			activityScore += delta
			matched = true
			matchedKeywords.add(clean)
			addReason(reasons, `${activity.name}: matched "${keyword}"`)
		}

		for (const keyword of activity.negativeKeywords || []) {
			const clean = normalizeText(keyword)
			if (!clean) continue
			const inTitle = titleText.includes(clean)
			const inDetail = !inTitle && detailText.includes(clean)
			if (!inTitle && !inDetail) continue

			const phrase = isPhrase(clean)
			const penalty = Math.round((phrase ? scoring.negativePhrase : scoring.negativeKeyword) * weight)
			activityScore -= penalty
			addReason(reasons, `${activity.name}: negative "${keyword}"`)
		}

		if (matched && activity.isHighPriority) {
			activityScore += Math.round(highPriorityBonus * weight)
			addReason(reasons, `${activity.name}: high priority bonus`)
		}

		if (matched) {
			matchedActivityIds.add(activity.id)
			matchedScopes.add(activity.scope)
		}

		totalScore += activityScore
	}

	const createdAt = parseDate(tender.createdAt)
	const closeDate = parseDate(tender.closeDate)
	const withinWindow = createdAt ? now.getTime() - createdAt.getTime() <= newWindowHours * 3600 * 1000 : false
	const stillOpen = closeDate ? closeDate.getTime() >= now.getTime() : true
	const isNew = Boolean(withinWindow && stillOpen)

	return {
		score: Math.max(0, Math.round(totalScore)),
		isNew,
		matchedActivityIds: Array.from(matchedActivityIds),
		matchedScopes: Array.from(matchedScopes),
		matchedKeywords: Array.from(matchedKeywords),
		reasons
	}
}
