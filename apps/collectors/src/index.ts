/**
 * Award Collectors Main Entry Point
 *
 * Orchestrates the execution of award source adapters,
 * stores results in staging, and handles scheduling.
 *
 * Usage:
 *   # Run all enabled adapters once
 *   node dist/index.js
 *
 *   # Run specific adapter
 *   COLLECTOR_ONLY=sample node dist/index.js
 *
 *   # Run in continuous mode (with schedule)
 *   COLLECTOR_MODE=scheduled node dist/index.js
 */

import pkg, { NotificationChannel, NotificationDigestMode } from '@prisma/client'
import { adapters, AwardRecord } from './adapters/index.js'
import { tenderAdapters } from './tenders/index.js'
import { TenderListingRecord } from './tenders/base.js'
import { embedText, embedTexts, normalizeEmbeddingInput, toVectorLiteral } from './utils/embeddings.js'

const { PrismaClient } = pkg as any
const prisma = new PrismaClient()

const SMART_FILTER_NEW_WINDOW_KEY = 'tenders.smartFilter.newWindowHours'
const SMART_FILTER_VERSION_KEY = 'tenders.smartFilter.version'
const SMART_FILTER_SIMILARITY_KEY = 'tenders.smartFilter.similarityThreshold'
const SMART_FILTER_THRESHOLD_KEY = 'tenders.smartFilter.threshold'
const DEFAULT_SMART_FILTER_NEW_WINDOW_HOURS = 24
const DEFAULT_SIMILARITY_THRESHOLD = 0.35
const DEFAULT_HIGH_PRIORITY_BONUS = 15
const DEFAULT_SMART_FILTER_THRESHOLD = 30
const TENDER_RECOMMENDATIONS_ACTIVITY = 'tenders.recommended'

interface CollectorStats {
	adapterId: string
	startTime: Date
	endTime?: Date
	recordsFound: number
	recordsInserted: number
	errors: string[]
}

interface TenderCollectorStats {
	adapterId: string
	startTime: Date
	endTime?: Date
	recordsFound: number
	recordsInserted: number
	errors: string[]
}

/**
 * Run a single adapter and store results
 */
async function runAdapter(adapterId: string): Promise<CollectorStats> {
	const stats: CollectorStats = {
		adapterId,
		startTime: new Date(),
		recordsFound: 0,
		recordsInserted: 0,
		errors: []
	}

	const adapter = adapters.find(a => a.id === adapterId)
	if (!adapter) {
		stats.errors.push(`Adapter not found: ${adapterId}`)
		stats.endTime = new Date()
		return stats
	}

	try {
		// Check if enabled
		const enabled = await adapter.isEnabled()
		if (!enabled) {
			console.log(`[${adapterId}] Adapter is disabled, skipping`)
			stats.endTime = new Date()
			return stats
		}

		console.log(`[${adapterId}] Starting collection...`)

		// Run the adapter
		const awards = await adapter.run()
		const dedupedAwards = dedupeAwards(awards)
		stats.recordsFound = dedupedAwards.length

		await cleanupDuplicateStaging(adapterId)

		// Store each award in staging
		for (const award of dedupedAwards) {
			try {
				await storeAward(award)
				stats.recordsInserted++
			} catch (err: any) {
				// Check for duplicate
				if (err.code === 'P2002') {
					console.log(`[${adapterId}] Skipping duplicate: ${award.tenderRef}`)
				} else {
					stats.errors.push(`Failed to store ${award.tenderRef}: ${err.message}`)
				}
			}
		}

		console.log(`[${adapterId}] Completed: ${stats.recordsInserted}/${stats.recordsFound} records stored`)
	} catch (err: any) {
		stats.errors.push(err.message)
		console.error(`[${adapterId}] Error:`, err)
	}

	stats.endTime = new Date()
	return stats
}

async function runTenderAdapter(adapterId: string): Promise<TenderCollectorStats> {
	const stats: TenderCollectorStats = {
		adapterId,
		startTime: new Date(),
		recordsFound: 0,
		recordsInserted: 0,
		errors: []
	}

	const adapter = tenderAdapters.find(a => a.id === adapterId)
	if (!adapter) {
		stats.errors.push(`Adapter not found: ${adapterId}`)
		stats.endTime = new Date()
		return stats
	}

	try {
		const enabled = await adapter.isEnabled()
		if (!enabled) {
			console.log(`[${adapterId}] Adapter is disabled, skipping`)
			stats.endTime = new Date()
			return stats
		}

		console.log(`[${adapterId}] Starting collection...`)

		const tenders = await adapter.run()
		const deduped = dedupeTenders(tenders)
		stats.recordsFound = deduped.length

		await cleanupDuplicateTenders(adapterId)

		for (const tender of deduped) {
			try {
				await storeTender(tender)
				stats.recordsInserted++
			} catch (err: any) {
				if (err.code === 'P2002') {
					console.log(`[${adapterId}] Skipping duplicate: ${tender.tenderRef}`)
				} else {
					stats.errors.push(`Failed to store ${tender.tenderRef}: ${err.message}`)
				}
			}
		}

		console.log(`[${adapterId}] Completed: ${stats.recordsInserted}/${stats.recordsFound} records stored`)
	} catch (err: any) {
		stats.errors.push(err.message)
		console.error(`[${adapterId}] Error:`, err)
	}

	stats.endTime = new Date()
	return stats
}

/**
 * Store a single award record in staging
 */
async function storeAward(award: AwardRecord): Promise<void> {
	if (award.tenderRef) {
		await prisma.awardStaging.deleteMany({
			where: { portal: award.portal, tenderRef: award.tenderRef }
		})
	} else if (award.sourceUrl) {
		await prisma.awardStaging.deleteMany({
			where: { portal: award.portal, sourceUrl: award.sourceUrl }
		})
	}

	await prisma.awardStaging.create({
		data: {
			portal: award.portal,
			tenderRef: award.tenderRef,
			client: award.client,
			title: award.title,
			titleOriginal: award.titleOriginal,
			awardDate: award.awardDate,
			winners: award.winners,
			awardValue: award.awardValue,
			codes: award.codes || [],
			status: 'new',
			sourceUrl: award.sourceUrl
		}
	})

	await upsertClientFromBuyer(award.client)
}

async function storeTender(tender: TenderListingRecord): Promise<void> {
	if (tender.tenderRef) {
		await prisma.ministryTender.deleteMany({
			where: { portal: tender.portal, tenderRef: tender.tenderRef }
		})
	} else if (tender.sourceUrl) {
		await prisma.ministryTender.deleteMany({
			where: { portal: tender.portal, sourceUrl: tender.sourceUrl }
		})
	}

	const tenderRecord = await prisma.ministryTender.create({
		data: {
			portal: tender.portal,
			tenderRef: tender.tenderRef,
			title: tender.title,
			titleOriginal: tender.titleOriginal,
			ministry: tender.ministry,
			publishDate: tender.publishDate,
			closeDate: tender.closeDate,
			requestedSectorType: tender.requestedSectorType,
			tenderBondValue: tender.tenderBondValue,
			documentsValue: tender.documentsValue,
			tenderType: tender.tenderType,
			purchaseUrl: tender.purchaseUrl,
			sourceUrl: tender.sourceUrl,
			status: 'new',
			tenantId: 'default'
		}
	})

	await upsertClientFromBuyer(tender.ministry)
	await upsertTenderClassification(tenderRecord)
}

function dedupeAwards(awards: AwardRecord[]): AwardRecord[] {
	const seen = new Set<string>()
	const result: AwardRecord[] = []

	for (const award of awards) {
		const key =
			award.tenderRef?.trim()
				? `${award.portal}::ref::${award.tenderRef.trim()}`
				: award.sourceUrl
					? `${award.portal}::url::${award.sourceUrl}`
					: `${award.portal}::title::${award.title ?? ''}`

		if (seen.has(key)) continue
		seen.add(key)
		result.push(award)
	}

	return result
}

function dedupeTenders(tenders: TenderListingRecord[]): TenderListingRecord[] {
	const seen = new Set<string>()
	const result: TenderListingRecord[] = []

	for (const tender of tenders) {
		const key =
			tender.tenderRef?.trim()
				? `${tender.portal}::ref::${tender.tenderRef.trim()}`
				: tender.sourceUrl
					? `${tender.portal}::url::${tender.sourceUrl}`
					: `${tender.portal}::title::${tender.title ?? ''}`

		if (seen.has(key)) continue
		seen.add(key)
		result.push(tender)
	}

	return result
}

async function cleanupDuplicateStaging(portal: string): Promise<void> {
	await prisma.$executeRaw`
		DELETE FROM "AwardStaging"
		WHERE id IN (
			SELECT id
			FROM (
				SELECT
					id,
					ROW_NUMBER() OVER (
						PARTITION BY portal, "tenderRef"
						ORDER BY "createdAt" DESC, id DESC
					) AS rn
				FROM "AwardStaging"
				WHERE portal = ${portal} AND "tenderRef" IS NOT NULL
			) dedupe
			WHERE dedupe.rn > 1
		)
	`
}

async function cleanupDuplicateTenders(portal: string): Promise<void> {
	await prisma.$executeRaw`
		DELETE FROM "MinistryTender"
		WHERE id IN (
			SELECT id
			FROM (
				SELECT
					id,
					ROW_NUMBER() OVER (
						PARTITION BY portal, "tenderRef"
						ORDER BY "createdAt" DESC, id DESC
					) AS rn
				FROM "MinistryTender"
				WHERE portal = ${portal} AND "tenderRef" IS NOT NULL
			) dedupe
			WHERE dedupe.rn > 1
		)
	`
}

async function upsertClientFromBuyer(buyer?: string): Promise<void> {
	const name = buyer?.trim()
	if (!name || name.toLowerCase() === 'unknown') return
	await prisma.client.upsert({
		where: { name_tenantId: { name, tenantId: 'default' } },
		create: { name, tenantId: 'default' },
		update: {}
	})
}

function parseNumber(value?: unknown): number | undefined {
	if (value === undefined || value === null) return undefined
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : undefined
	}
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : undefined
}

async function loadSmartFilterConfig() {
	const rows = await prisma.appSetting.findMany({
		where: {
			key: {
				in: [
					SMART_FILTER_NEW_WINDOW_KEY,
					SMART_FILTER_VERSION_KEY,
					SMART_FILTER_SIMILARITY_KEY,
					SMART_FILTER_THRESHOLD_KEY
				]
			}
		}
	})
	const map = new Map<string, string>(rows.map((row: any) => [row.key, row.value]))
	const newWindowHours = parseNumber(map.get(SMART_FILTER_NEW_WINDOW_KEY)) ?? DEFAULT_SMART_FILTER_NEW_WINDOW_HOURS
	const version = Math.max(1, Math.floor(parseNumber(map.get(SMART_FILTER_VERSION_KEY)) ?? 1))
	const similarityThreshold = parseNumber(map.get(SMART_FILTER_SIMILARITY_KEY)) ?? DEFAULT_SIMILARITY_THRESHOLD
	const threshold = parseNumber(map.get(SMART_FILTER_THRESHOLD_KEY)) ?? DEFAULT_SMART_FILTER_THRESHOLD
	return { newWindowHours, version, similarityThreshold, threshold }
}

function parseVector(value: unknown): number[] | null {
	if (!value) return null
	if (Array.isArray(value)) {
		const parsed = value.map(entry => Number(entry)).filter(entry => Number.isFinite(entry))
		return parsed.length ? parsed : null
	}
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	if (!trimmed) return null
	const cleaned = trimmed.replace(/^\[|\]$/g, '')
	if (!cleaned) return null
	const parsed = cleaned
		.split(',')
		.map(entry => Number(entry.trim()))
		.filter(entry => Number.isFinite(entry))
	return parsed.length ? parsed : null
}

function buildTenderEmbeddingInput(tender: any) {
	return normalizeEmbeddingInput([
		tender.title,
		tender.ministry,
		tender.requestedSectorType,
		tender.tenderType
	])
}

function isNegativeActivity(activity: {
	scope?: string | null
	keywords?: string[]
	negativeKeywords?: string[]
}) {
	const positive = (activity.keywords || []).filter(Boolean)
	const negative = (activity.negativeKeywords || []).filter(Boolean)
	return activity.scope === 'OTHER' && positive.length === 0 && negative.length > 0
}

type ActivityEmbeddingSource = {
	id: string
	name: string
	description?: string | null
	keywords?: string[] | null
	negativeKeywords?: string[] | null
	scope?: string | null
}

function buildActivityEmbeddingInput(activity: ActivityEmbeddingSource) {
	const keywords = (activity.keywords || []).map(entry => entry.trim()).filter(Boolean)
	const negative = (activity.negativeKeywords || []).map(entry => entry.trim()).filter(Boolean)
	const isNegative = isNegativeActivity({ scope: activity.scope, keywords, negativeKeywords: negative })
	const parts = [activity.name, activity.description, ...(isNegative ? negative : keywords)]
	return { text: normalizeEmbeddingInput(parts), isNegative }
}

async function updateActivityEmbedding(activity: ActivityEmbeddingSource): Promise<void> {
	const input = buildActivityEmbeddingInput(activity)
	if (!input.text) return
	const embedding = await embedText(input.text)
	const vectorLiteral = toVectorLiteral(embedding)
	await prisma.$executeRaw`
		UPDATE "TenderActivity"
		SET "embedding" = ${vectorLiteral}::vector
		WHERE id = ${activity.id}
	`
}

async function ensureActivityEmbeddings(
	tenantId: string,
	activities: ActivityEmbeddingSource[]
): Promise<void> {
	const missing = (await prisma.$queryRaw`
		SELECT id
		FROM "TenderActivity"
		WHERE "tenantId" = ${tenantId}
		  AND "isActive" = true
		  AND "embedding" IS NULL
	`) as Array<{ id: string }>
	if (!missing.length) return
	const map = new Map<string, ActivityEmbeddingSource>(
		activities.map(activity => [activity.id, activity])
	)
	const pairs = missing
		.map((row: { id: string }) => map.get(row.id))
		.filter((activity): activity is ActivityEmbeddingSource => Boolean(activity))
		.map((activity: ActivityEmbeddingSource) => {
			const input = buildActivityEmbeddingInput(activity)
			return input.text ? { activity, text: input.text } : null
		})
		.filter(Boolean) as Array<{ activity: ActivityEmbeddingSource; text: string }>
	if (!pairs.length) return
	const texts = pairs.map(pair => pair.text)
	const batchSize = Math.max(1, Math.min(Number(process.env.EMBEDDING_BATCH_SIZE || 50), 100))
	for (let i = 0; i < texts.length; i += batchSize) {
		const slice = texts.slice(i, i + batchSize)
		const vectors = await embedTexts(slice)
		for (let index = 0; index < vectors.length; index += 1) {
			const activity = pairs[i + index].activity
			const vectorLiteral = toVectorLiteral(vectors[index])
			await prisma.$executeRaw`
				UPDATE "TenderActivity"
				SET "embedding" = ${vectorLiteral}::vector
				WHERE id = ${activity.id}
			`
		}
	}
}

async function ensureTenderEmbedding(tender: any): Promise<number[]> {
	const rows = await prisma.$queryRaw<Array<{ embedding: unknown }>>`
		SELECT "embedding"::text as embedding
		FROM "MinistryTender"
		WHERE id = ${tender.id}
	`
	const existing = rows[0]?.embedding
	const parsed = parseVector(existing)
	if (parsed) return parsed

	const text = buildTenderEmbeddingInput(tender)
	if (!text) {
		throw new Error('Tender embedding text is empty')
	}
	const embedding = await embedText(text)
	const vectorLiteral = toVectorLiteral(embedding)
	await prisma.$executeRaw`
		UPDATE "MinistryTender"
		SET "embedding" = ${vectorLiteral}::vector
		WHERE id = ${tender.id}
	`
	return embedding
}

function buildSemanticClassification(tender: any, activityMatches: any[], config: any) {
	let totalScore = 0
	const scopeScores: Record<string, number> = {
		ITSQ: 0,
		IOT_SHABAKA: 0,
		OTHER: 0
	}
	const matchedActivityIds: string[] = []
	const matchedScopes = new Set<string>()
	const matchedKeywords: string[] = []
	const reasons: string[] = []
	const addReason = (reason: string) => {
		if (reasons.length >= 20) return
		reasons.push(reason)
	}

	for (const activity of activityMatches) {
		const similarity = Number(activity.similarity)
		if (!Number.isFinite(similarity)) continue
		const weight = activity.weight ?? 1
		if (weight <= 0) continue
		if (similarity < config.similarityThreshold) continue

		const negative = isNegativeActivity(activity)
		const scoreDelta = Math.round(similarity * 100 * weight)
		if (negative) {
			totalScore -= scoreDelta
			if (activity.scope) scopeScores[activity.scope] = (scopeScores[activity.scope] || 0) - scoreDelta
			addReason(`Negative: ${activity.name} (${similarity.toFixed(2)})`)
			continue
		}

		totalScore += scoreDelta
		if (activity.scope) scopeScores[activity.scope] = (scopeScores[activity.scope] || 0) + scoreDelta
		if (activity.isHighPriority) {
			totalScore += DEFAULT_HIGH_PRIORITY_BONUS
			if (activity.scope) {
				scopeScores[activity.scope] = (scopeScores[activity.scope] || 0) + DEFAULT_HIGH_PRIORITY_BONUS
			}
		}
		matchedActivityIds.push(activity.id)
		matchedScopes.add(activity.scope)
		matchedKeywords.push(activity.name)
		addReason(`Match: ${activity.name} (${similarity.toFixed(2)})`)
	}

	const createdAt = tender.createdAt ? new Date(tender.createdAt) : null
	const closeDate = tender.closeDate ? new Date(tender.closeDate) : null
	const now = new Date()
	const withinWindow = createdAt
		? now.getTime() - createdAt.getTime() <= config.newWindowHours * 60 * 60 * 1000
		: false
	const stillOpen = closeDate ? closeDate.getTime() >= now.getTime() : true
	const isNew = Boolean(withinWindow && stillOpen)

	return {
		score: Math.max(0, Math.round(totalScore)),
		scoreItsq: Math.max(0, Math.round(scopeScores.ITSQ || 0)),
		scoreIotShabaka: Math.max(0, Math.round(scopeScores.IOT_SHABAKA || 0)),
		scoreOther: Math.max(0, Math.round(scopeScores.OTHER || 0)),
		isNew,
		matchedActivityIds,
		matchedScopes: Array.from(matchedScopes),
		matchedKeywords,
		reasons
	}
}

async function upsertTenderClassification(tender: any): Promise<void> {
	const activities = await prisma.tenderActivity.findMany({
		where: { tenantId: tender.tenantId, isActive: true }
	})
	const config = await loadSmartFilterConfig()
	const tenderEmbedding = await ensureTenderEmbedding(tender)
	await ensureActivityEmbeddings(tender.tenantId, activities)
	const vectorLiteral = toVectorLiteral(tenderEmbedding)
	const activityMatches = await prisma.$queryRaw<Array<any>>`
		SELECT
			id,
			name,
			scope,
			weight,
			"isHighPriority",
			keywords,
			"negativeKeywords",
			(1 - ("embedding" <=> ${vectorLiteral}::vector))::float AS similarity
		FROM "TenderActivity"
		WHERE "tenantId" = ${tender.tenantId}
		  AND "isActive" = true
		  AND "embedding" IS NOT NULL
	`
	const result = buildSemanticClassification(tender, activityMatches, config)

	await prisma.tenderClassification.upsert({
		where: { tenderId: tender.id },
		create: {
			tenderId: tender.id,
			classificationVersion: config.version,
			score: result.score,
			scoreItsq: result.scoreItsq,
			scoreIotShabaka: result.scoreIotShabaka,
			scoreOther: result.scoreOther,
			isNew: result.isNew,
			matchedActivityIds: result.matchedActivityIds,
			matchedScopes: result.matchedScopes,
			matchedKeywords: result.matchedKeywords,
			reasons: result.reasons,
			tenantId: tender.tenantId
		},
		update: {
			classificationVersion: config.version,
			score: result.score,
			scoreItsq: result.scoreItsq,
			scoreIotShabaka: result.scoreIotShabaka,
			scoreOther: result.scoreOther,
			isNew: result.isNew,
			matchedActivityIds: result.matchedActivityIds,
			matchedScopes: result.matchedScopes,
			matchedKeywords: result.matchedKeywords,
			reasons: result.reasons,
			tenantId: tender.tenantId
		}
	})
}

function escapeHtml(value?: string | null) {
	if (!value) return ''
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function formatDate(value?: Date | string | null) {
	if (!value) return '-'
	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return date.toISOString().slice(0, 10)
}

function buildRecommendationRows(tenders: Array<any>) {
	if (!tenders.length) {
		return `<tr><td colspan="7">No tenders met the current threshold.</td></tr>`
	}
	return tenders
		.map(tender => {
			const score = tender.classification?.score ?? 0
			const matches = (tender.classification?.matchedKeywords || []).slice(0, 3)
			const matchText =
				matches.length > 0 ? matches.join(', ') : (tender.classification?.matchedScopes || []).join(', ')
			const purchaseUrl = tender.purchaseUrl?.trim()
			const purchaseLink = purchaseUrl
				? `<a href="${escapeHtml(purchaseUrl)}" target="_blank" rel="noreferrer">Link</a>`
				: '—'
			return `
				<tr>
					<td>${escapeHtml(tender.tenderRef || '-')}</td>
					<td>${escapeHtml(tender.title || '-')}</td>
					<td>${escapeHtml(tender.ministry || '-')}</td>
					<td>${formatDate(tender.closeDate)}</td>
					<td>${escapeHtml(String(score))}</td>
					<td>${escapeHtml(matchText || '-')}</td>
					<td>${purchaseLink}</td>
				</tr>
			`
		})
		.join('')
}

async function resolveTenderRecipients(tenantId: string) {
	const defaults = await prisma.notificationRoutingDefault.findFirst({
		where: { tenantId, activity: TENDER_RECOMMENDATIONS_ACTIVITY, stage: null }
	})
	if (!defaults) {
		return prisma.user.findMany({
			where: { tenantId, isActive: true },
			select: { id: true, email: true, name: true }
		})
	}
	const users = await prisma.user.findMany({
		where: { tenantId, isActive: true, id: { in: defaults.userIds || [] } },
		select: { id: true, email: true, name: true }
	})
	if (!(defaults.businessRoleIds || []).length) return users
	const roleLinks = await prisma.userBusinessRole.findMany({
		where: {
			businessRoleId: { in: defaults.businessRoleIds || [] },
			user: { tenantId, isActive: true }
		},
		include: { user: true }
	})
	const merged = new Map(users.map(user => [user.id, user]))
	for (const link of roleLinks) {
		if (!link.user) continue
		merged.set(link.user.id, {
			id: link.user.id,
			email: link.user.email,
			name: link.user.name
		})
	}
	return Array.from(merged.values())
}

function shouldSend(channel: NotificationChannel, pref?: any) {
	if (!pref) return true
	if (!pref.enabled) return false
	if (pref.digestMode === NotificationDigestMode.OFF) return false
	return true
}

async function dispatchTenderRecommendations(tenantId: string, trigger: 'collector' | 'reprocess') {
	const config = await loadSmartFilterConfig()
	const threshold = config.threshold ?? DEFAULT_SMART_FILTER_THRESHOLD
	const limit = Math.max(1, Math.min(Number(process.env.TENDER_RECOMMENDATION_LIMIT || 10), 50))
	const now = new Date()
	const where = {
		tenantId,
		status: { not: 'promoted' },
		classification: { is: { score: { gte: threshold }, isNew: true } },
		OR: [{ closeDate: null }, { closeDate: { gte: now } }]
	} as any
	const [items, total] = await prisma.$transaction([
		prisma.ministryTender.findMany({
			where,
			include: { classification: true },
			orderBy: [{ classification: { score: 'desc' } }, { closeDate: 'asc' }, { publishDate: 'desc' }],
			take: limit
		}),
		prisma.ministryTender.count({ where })
	])
	const baseUrl = (process.env.APP_BASE_URL || process.env.WEB_ORIGIN || 'http://localhost:8080').replace(/\/+$/, '')
	const actionUrl = `${baseUrl}/tenders/available`
	const subject = total
		? `Tender recommendations ready (${total})`
		: 'Tender recommendations ready'
	const summaryText = total
		? `Showing ${Math.min(limit, total)} of ${total} new tenders that meet the current threshold (${threshold}).`
		: `No new tenders met the current threshold (${threshold}) for this ${trigger} run.`
	const bodyLines = items.map((tender: any, index: number) => {
		const label = tender.title || tender.tenderRef || 'Untitled tender'
		const score = tender.classification?.score ?? 0
		return `${index + 1}. ${label} (score ${score})`
	})
	const body = total
		? [`Tender recommendations are ready after the ${trigger}.`, ...bodyLines].join('\n')
		: `No new tenders met the current threshold (${threshold}) after the ${trigger}.`
	const payload = {
		actionUrl,
		actionLabel: 'Open tenders',
		templateName: 'tender-recommendations',
		templateData: {
			SUBJECT: subject,
			HERO_HEADLINE: 'Tender recommendations ready',
			HERO_SUBTEXT: `Updated after the latest ${trigger} run.`,
			SUMMARY_TEXT: summaryText,
			TABLE_ROWS: buildRecommendationRows(items),
			CTA_URL: actionUrl,
			CTA_TEXT: 'Open tenders'
		}
	}

	const recipients = await resolveTenderRecipients(tenantId)
	if (!recipients.length) return
	const prefRows = await prisma.notificationPreference.findMany({
		where: { userId: { in: recipients.map(user => user.id) }, activity: TENDER_RECOMMENDATIONS_ACTIVITY }
	})
	const prefMap = new Map(prefRows.map(row => [`${row.userId}:${row.channel}`, row]))
	const notifications: any[] = []
	for (const recipient of recipients) {
		for (const channel of [NotificationChannel.EMAIL, NotificationChannel.IN_APP]) {
			const pref = prefMap.get(`${recipient.id}:${channel}`)
			if (!shouldSend(channel, pref)) continue
			notifications.push({
				type: TENDER_RECOMMENDATIONS_ACTIVITY,
				channel,
				activity: TENDER_RECOMMENDATIONS_ACTIVITY,
				userId: recipient.id,
				to: channel === NotificationChannel.EMAIL ? recipient.email : undefined,
				subject,
				body,
				payload,
				status: channel === NotificationChannel.EMAIL ? 'pending' : 'unread',
				tenantId
			})
		}
	}
	if (!notifications.length) return
	await prisma.notification.createMany({ data: notifications })
}

async function dispatchTenderRecommendationsForAllTenants(trigger: 'collector' | 'reprocess') {
	const tenants = await prisma.ministryTender.findMany({
		distinct: ['tenantId'],
		select: { tenantId: true }
	})
	for (const tenant of tenants) {
		if (!tenant.tenantId) continue
		try {
			await dispatchTenderRecommendations(tenant.tenantId, trigger)
		} catch (err) {
			console.warn('[tenders] Failed to send tender recommendations', err)
		}
	}
}

/**
 * Run all enabled adapters
 */
async function runAll(): Promise<CollectorStats[]> {
	const results: CollectorStats[] = []

	// Check for specific adapter filter
	const onlyAdapter = process.env.COLLECTOR_ONLY

	for (const adapter of adapters) {
		if (onlyAdapter && adapter.id !== onlyAdapter) {
			continue
		}

		const stats = await runAdapter(adapter.id)
		results.push(stats)
	}

	return results
}

async function runAllTenders(): Promise<TenderCollectorStats[]> {
	const results: TenderCollectorStats[] = []
	const onlyAdapter = process.env.COLLECTOR_ONLY

	for (const adapter of tenderAdapters) {
		if (onlyAdapter && adapter.id !== onlyAdapter) {
			continue
		}

		const stats = await runTenderAdapter(adapter.id)
		results.push(stats)
	}

	return results
}

/**
 * Print summary of collection run
 */
function printSummary(results: CollectorStats[]): void {
	console.log('\n=== Collection Summary ===')
	for (const stats of results) {
		const duration = stats.endTime
			? ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(1)
			: '?'
		console.log(
			`[${stats.adapterId}] Found: ${stats.recordsFound}, Inserted: ${stats.recordsInserted}, ` +
				`Duration: ${duration}s, Errors: ${stats.errors.length}`
		)
		if (stats.errors.length > 0) {
			stats.errors.forEach(e => console.log(`  - ${e}`))
		}
	}
	console.log('========================\n')
}

function printTenderSummary(results: TenderCollectorStats[]): void {
	console.log('\n=== Tender Collection Summary ===')
	for (const stats of results) {
		const duration = stats.endTime
			? ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(1)
			: '?'
		console.log(
			`[${stats.adapterId}] Found: ${stats.recordsFound}, Inserted: ${stats.recordsInserted}, ` +
				`Duration: ${duration}s, Errors: ${stats.errors.length}`
		)
		if (stats.errors.length > 0) {
			stats.errors.forEach(e => console.log(`  - ${e}`))
		}
	}
	console.log('===============================\n')
}

/**
 * Main entry point
 */
let running = false

async function runWithRange(adapterId: string | undefined, fromDate?: string, toDate?: string) {
	if (running) {
		return { error: 'Collector already running' }
	}
	running = true

	const today = new Date().toISOString().slice(0, 10)
	const resolvedTo = toDate || today
	const prevFrom = process.env.MONAQASAT_FROM_DATE
	const prevTo = process.env.MONAQASAT_TO_DATE
	process.env.MONAQASAT_FROM_DATE = fromDate || ''
	process.env.MONAQASAT_TO_DATE = resolvedTo || ''
	if (adapterId) process.env.COLLECTOR_ONLY = adapterId

	try {
		const results = adapterId ? [await runAdapter(adapterId)] : await runAll()
		return { results }
	} finally {
		if (prevFrom !== undefined) process.env.MONAQASAT_FROM_DATE = prevFrom
		else delete process.env.MONAQASAT_FROM_DATE
		if (prevTo !== undefined) process.env.MONAQASAT_TO_DATE = prevTo
		else delete process.env.MONAQASAT_TO_DATE
		if (adapterId) delete process.env.COLLECTOR_ONLY
		running = false
	}
}

async function runTenderCollection(adapterId?: string, fromDate?: string, toDate?: string) {
	if (running) {
		return { error: 'Collector already running' }
	}
	running = true

	const today = new Date().toISOString().slice(0, 10)
	const resolvedTo = toDate || today
	const prevCollectorOnly = process.env.COLLECTOR_ONLY
	const prevFrom = process.env.MONAQASAT_TENDER_FROM_DATE
	const prevTo = process.env.MONAQASAT_TENDER_TO_DATE
	if (fromDate !== undefined) process.env.MONAQASAT_TENDER_FROM_DATE = fromDate
	if (toDate !== undefined || resolvedTo) process.env.MONAQASAT_TENDER_TO_DATE = resolvedTo
	if (adapterId) process.env.COLLECTOR_ONLY = adapterId

	try {
		const results = adapterId ? [await runTenderAdapter(adapterId)] : await runAllTenders()
		await dispatchTenderRecommendationsForAllTenants('collector')
		return { results }
	} finally {
		if (adapterId && prevCollectorOnly === undefined) delete process.env.COLLECTOR_ONLY
		else if (prevCollectorOnly !== undefined) process.env.COLLECTOR_ONLY = prevCollectorOnly
		if (prevFrom !== undefined) process.env.MONAQASAT_TENDER_FROM_DATE = prevFrom
		else delete process.env.MONAQASAT_TENDER_FROM_DATE
		if (prevTo !== undefined) process.env.MONAQASAT_TENDER_TO_DATE = prevTo
		else delete process.env.MONAQASAT_TENDER_TO_DATE
		running = false
	}
}

async function main(): Promise<void> {
	console.log('Award Collectors starting...')
	console.log(`Mode: ${process.env.COLLECTOR_MODE || 'once'}`)
	console.log(`Award adapters: ${adapters.map(a => a.id).join(', ')}`)
	console.log(`Tender adapters: ${tenderAdapters.map(a => a.id).join(', ')}`)

	if (process.env.COLLECTOR_SERVER === 'true') {
		const { createServer } = await import('http')
		const port = Number(process.env.COLLECTOR_PORT || 4100)
		const server = createServer(async (req, res) => {
			if (req.method === 'GET' && req.url === '/health') {
				res.writeHead(200, { 'content-type': 'application/json' })
				res.end(JSON.stringify({ status: 'ok' }))
				return
			}
			if (req.method === 'POST' && req.url === '/run') {
				let body = ''
				req.on('data', chunk => (body += chunk))
				req.on('end', async () => {
					try {
						const parsed = body ? JSON.parse(body) : {}
						const result = await runWithRange(parsed.adapterId, parsed.fromDate, parsed.toDate)
						res.writeHead(200, { 'content-type': 'application/json' })
						res.end(JSON.stringify(result))
					} catch (err: any) {
						res.writeHead(400, { 'content-type': 'application/json' })
						res.end(JSON.stringify({ error: err.message || 'Invalid request' }))
					}
				})
				return
			}
			if (req.method === 'POST' && req.url === '/run-tenders') {
				let body = ''
				req.on('data', chunk => (body += chunk))
				req.on('end', async () => {
					try {
						const parsed = body ? JSON.parse(body) : {}
						const result = await runTenderCollection(parsed.adapterId, parsed.fromDate, parsed.toDate)
						res.writeHead(200, { 'content-type': 'application/json' })
						res.end(JSON.stringify(result))
					} catch (err: any) {
						res.writeHead(400, { 'content-type': 'application/json' })
						res.end(JSON.stringify({ error: err.message || 'Invalid request' }))
					}
				})
				return
			}
			res.writeHead(404, { 'content-type': 'application/json' })
			res.end(JSON.stringify({ error: 'Not found' }))
		})
		server.listen(port, () => {
			console.log(`Collector server listening on ${port}`)
		})
		return
	}

	const mode = process.env.COLLECTOR_MODE || 'once'

	if (mode === 'scheduled') {
		// Scheduled mode: run periodically
		const intervalMinutes = parseInt(process.env.COLLECTOR_INTERVAL_MINUTES || '60', 10)
		console.log(`Running in scheduled mode, interval: ${intervalMinutes} minutes`)

		// Run immediately
		let results = await runAll()
		printSummary(results)
		let tenderResults = await runAllTenders()
		printTenderSummary(tenderResults)
		await dispatchTenderRecommendationsForAllTenants('collector')

		// Then schedule
		setInterval(async () => {
			console.log(`\n[${new Date().toISOString()}] Scheduled run starting...`)
			results = await runAll()
			printSummary(results)
			tenderResults = await runAllTenders()
			printTenderSummary(tenderResults)
			await dispatchTenderRecommendationsForAllTenants('collector')
		}, intervalMinutes * 60 * 1000)
	} else {
		// One-time run
		const results = await runAll()
		printSummary(results)
		const tenderResults = await runAllTenders()
		printTenderSummary(tenderResults)
		await dispatchTenderRecommendationsForAllTenants('collector')

		// Exit after one-time run
		await prisma.$disconnect()
	}
}

main().catch(err => {
	console.error('Fatal error:', err)
	process.exit(1)
})
