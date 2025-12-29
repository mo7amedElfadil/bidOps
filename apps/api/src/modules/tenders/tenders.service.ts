import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { MinistryTender, NotificationChannel, Prisma, TenderClassificationRunType, TenderScope } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { enqueueTenderCollector } from '../../queues/collector.queue'
import { parsePagination } from '../../utils/pagination'
import { normalizeDateInput, parseDateInput } from '../../utils/date'
import { containsArabic, translateArabicBatchStrict, translateArabicStrict } from '../../utils/translate'
import { embedText, embedTexts, normalizeEmbeddingInput, toVectorLiteral } from '../../utils/embeddings'
import { buildFrontendUrl } from '../../utils/frontend-url'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationActivities } from '../notifications/notifications.constants'

const SMART_FILTER_THRESHOLD_KEY = 'tenders.smartFilter.threshold'
const SMART_FILTER_NEW_WINDOW_KEY = 'tenders.smartFilter.newWindowHours'
const SMART_FILTER_GROUP_SCOPES_KEY = 'tenders.smartFilter.groupScopes'
const SMART_FILTER_VERSION_KEY = 'tenders.smartFilter.version'
const SMART_FILTER_SIMILARITY_KEY = 'tenders.smartFilter.similarityThreshold'
const DEFAULT_SMART_FILTER_THRESHOLD = 30
const DEFAULT_SMART_FILTER_NEW_WINDOW_HOURS = 24
const DEFAULT_GROUP_SCOPES: TenderScope[] = ['ITSQ', 'IOT_SHABAKA']
const DEFAULT_SIMILARITY_THRESHOLD = 0.35
const DEFAULT_HIGH_PRIORITY_BONUS = 15

type RecommendationCriteria = {
	scopes?: string[] | string
	minScore?: number
	limit?: number
	includePromoted?: boolean
	includeClosed?: boolean
	onlyNew?: boolean
	portal?: string
}

@Injectable()
export class TendersService {
	constructor(
		private prisma: PrismaService,
		private notifications: NotificationsService
	) {}

	async list(
		filters: {
			q?: string
			portal?: string
			status?: string
			scope?: string
			scopes?: string
			minScore?: number
			isNew?: string
			promoted?: string
			goNoGoStatus?: string
			fromDate?: string
			toDate?: string
			sortBy?: string
			sortDir?: string
			page?: number
			pageSize?: number
		},
		tenantId: string
	) {
		const where: Prisma.MinistryTenderWhereInput = { tenantId }
		const andFilters: Prisma.MinistryTenderWhereInput[] = []
		const { page, pageSize, skip } = parsePagination(filters, 25, 200)

		const from = parseDateInput(filters.fromDate)
		const to = parseDateInput(filters.toDate, true)
		if (from || to) {
			const publishRange: Prisma.DateTimeFilter = {}
			const closeRange: Prisma.DateTimeFilter = {}
			if (from) {
				publishRange.gte = from
				closeRange.gte = from
			}
			if (to) {
				publishRange.lte = to
				closeRange.lte = to
			}
			andFilters.push({
				OR: [{ publishDate: publishRange }, { closeDate: closeRange }]
			})
		}
		if (filters.portal) where.portal = filters.portal
		if (filters.status) where.status = filters.status
		if (filters.q?.trim()) {
			const term = filters.q.trim()
			const like: Prisma.StringFilter = { contains: term, mode: 'insensitive' as Prisma.QueryMode }
			const orFilters: Prisma.MinistryTenderWhereInput[] = [
				{ portal: like },
				{ tenderRef: like },
				{ title: like },
				{ ministry: like },
				{ status: like },
				{ tenderType: like },
				{ requestedSectorType: like },
				{ purchaseUrl: like },
				{ sourceUrl: like }
			]
			const numericTerm = Number(term.replace(/[^\d.-]/g, ''))
			if (!Number.isNaN(numericTerm)) {
				orFilters.push({ tenderBondValue: numericTerm }, { documentsValue: numericTerm })
			}
			where.OR = orFilters
		}

		const minScore = this.parseNumber(filters.minScore)
		const isNew = this.parseBoolean(filters.isNew)
		const promoted = this.parseBoolean(filters.promoted)
		const scopeTokens = (filters.scopes || filters.scope || '')
			.split(',')
			.map(entry => entry.trim().toUpperCase())
			.filter(Boolean)

		const classificationFilters: Prisma.TenderClassificationWhereInput = {}
		if (typeof minScore === 'number') {
			const scoreField = this.resolveScoreSortField(scopeTokens)
			;(classificationFilters as any)[scoreField] = { gte: minScore }
		}
		if (isNew === true) {
			const config = await this.loadSmartFilterConfig()
			const now = new Date()
			const windowStart = new Date(now.getTime() - config.newWindowHours * 60 * 60 * 1000)
			andFilters.push({
				createdAt: { gte: windowStart },
				OR: [{ closeDate: null }, { closeDate: { gte: now } }]
			})
		}

		if (scopeTokens.length) {
			const scopeSet = new Set<TenderScope>()
			if (scopeTokens.includes('GROUP')) {
				const config = await this.loadSmartFilterConfig()
				for (const scope of config.groupScopes) {
					scopeSet.add(scope)
				}
			}
			for (const raw of scopeTokens) {
				if (raw === 'GROUP') continue
				const scope = this.normalizeScope(raw)
				if (scope) scopeSet.add(scope)
			}
			const scopes = Array.from(scopeSet)
			if (scopes.length) {
				classificationFilters.matchedScopes = { hasSome: scopes }
			}
		}

		if (Object.keys(classificationFilters).length) {
			andFilters.push({ classification: { is: classificationFilters } })
		}

		if (promoted === true) {
			const opps = await this.prisma.opportunity.findMany({
				where: { tenantId, sourceTenderId: { not: null } },
				select: { sourceTenderId: true }
			})
			const tenderIds = opps.map(item => item.sourceTenderId).filter(Boolean) as string[]
			const orFilters: Prisma.MinistryTenderWhereInput[] = [{ status: 'promoted' }]
			if (tenderIds.length) {
				orFilters.push({ id: { in: tenderIds } })
			}
			andFilters.push({ OR: orFilters })
		}

		if (filters.goNoGoStatus?.trim()) {
			const status = filters.goNoGoStatus.trim().toUpperCase()
			const opps = await this.prisma.opportunity.findMany({
				where: {
					tenantId,
					goNoGoStatus: status as any,
					sourceTenderId: { not: null }
				},
				select: { sourceTenderId: true }
			})
			const tenderIds = opps.map(item => item.sourceTenderId).filter(Boolean) as string[]
			if (!tenderIds.length) {
				return { items: [], total: 0, page, pageSize }
			}
			andFilters.push({ id: { in: tenderIds } })
		}

		if (andFilters.length) {
			where.AND = andFilters
		}

		const orderBy = this.resolveSortOrder(filters.sortBy, filters.sortDir, scopeTokens)

		const [items, total] = await this.prisma.$transaction([
			this.prisma.ministryTender.findMany({
				where,
				include: { classification: true },
				orderBy,
				skip,
				take: pageSize
			}),
			this.prisma.ministryTender.count({ where })
		])

		if (!items.length) {
			return { items, total, page, pageSize }
		}
		const tenderIds = items.map(item => item.id)
		const opps = await this.prisma.opportunity.findMany({
			where: {
				tenantId,
				sourceTenderId: { in: tenderIds }
			},
			select: {
				id: true,
				sourceTenderId: true,
				goNoGoStatus: true,
				goNoGoUpdatedAt: true
			}
		})
		const map = new Map<string, typeof opps[number]>()
		for (const opp of opps) {
			if (opp.sourceTenderId) {
				map.set(opp.sourceTenderId, opp)
			}
		}
		const enriched = items.map(item => {
			const match = map.get(item.id)
			return {
				...item,
				opportunityId: match?.id ?? null,
				goNoGoStatus: match?.goNoGoStatus ?? null,
				goNoGoUpdatedAt: match?.goNoGoUpdatedAt ?? null
			}
		})
		return { items: enriched, total, page, pageSize }
	}

	get(id: string) {
		return this.prisma.ministryTender.findUnique({ where: { id }, include: { classification: true } })
	}

	async create(data: any, tenantId: string) {
		const normalizedTitle = await this.normalizeTenderTitle(data)
		const tender = await this.prisma.ministryTender.create({
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				title: normalizedTitle.title,
				titleOriginal: normalizedTitle.titleOriginal,
				ministry: data.ministry,
				publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
				closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
				requestedSectorType: data.requestedSectorType,
				tenderBondValue: data.tenderBondValue !== undefined ? Number(data.tenderBondValue) : undefined,
				documentsValue: data.documentsValue !== undefined ? Number(data.documentsValue) : undefined,
				tenderType: data.tenderType,
				purchaseUrl: data.purchaseUrl,
				sourceUrl: data.sourceUrl,
				status: data.status || 'new',
				tenantId
			}
		})
		await this.upsertClassification(tender, tenantId)
		return tender
	}

	async update(id: string, data: any) {
		const normalizedTitle = await this.normalizeTenderTitle(data)
		const tender = await this.prisma.ministryTender.update({
			where: { id },
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				title: normalizedTitle.title,
				titleOriginal: normalizedTitle.titleOriginal,
				ministry: data.ministry,
				publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
				closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
				requestedSectorType: data.requestedSectorType,
				tenderBondValue: data.tenderBondValue !== undefined ? Number(data.tenderBondValue) : undefined,
				documentsValue: data.documentsValue !== undefined ? Number(data.documentsValue) : undefined,
				tenderType: data.tenderType,
				purchaseUrl: data.purchaseUrl,
				sourceUrl: data.sourceUrl,
				status: data.status
			}
		})
		await this.upsertClassification(tender, tender.tenantId)
		return tender
	}

	remove(id: string) {
		return this.prisma.ministryTender.delete({ where: { id } })
	}

	async promoteToOpportunity(id: string, tenantId: string) {
		const tender = await this.prisma.ministryTender.findUnique({ where: { id } })
		if (!tender) throw new BadRequestException('Tender not found')
		const clientName = tender.ministry?.trim()
		if (!clientName) throw new BadRequestException('Tender ministry is missing')

		const client = await this.prisma.client.upsert({
			where: { name_tenantId: { name: clientName, tenantId } },
			create: { name: clientName, tenantId },
			update: {}
		})

		let opportunity = await this.prisma.opportunity.findFirst({
			where: {
				tenantId,
				sourceTenderId: tender.id
			}
		})

		if (!opportunity && tender.tenderRef) {
			const match = await this.prisma.opportunity.findFirst({
				where: {
					tenantId,
					sourcePortal: tender.portal,
					tenderRef: tender.tenderRef
				}
			})
			if (match) {
				opportunity = await this.prisma.opportunity.update({
					where: { id: match.id },
					data: { sourceTenderId: tender.id }
				})
			}
		}

		if (!opportunity) {
			opportunity = await this.prisma.opportunity.create({
				data: {
					clientId: client.id,
					title: tender.title || tender.tenderRef || 'New Opportunity',
					tenderRef: tender.tenderRef || undefined,
					sourcePortal: tender.portal,
					sourceTenderId: tender.id,
					discoveryDate: tender.publishDate || undefined,
					tenantId
				}
			})
		}

		await this.prisma.ministryTender.update({
			where: { id },
			data: { status: 'promoted' }
		})

		return opportunity
	}

	async triggerCollector(payload: { adapterId?: string; fromDate?: string; toDate?: string }) {
		const today = new Date().toISOString().slice(0, 10)
		const normalizedFrom = normalizeDateInput(payload.fromDate)
		const normalizedTo = normalizeDateInput(payload.toDate) || today
		const job = await enqueueTenderCollector({
			adapterId: payload.adapterId,
			fromDate: normalizedFrom,
			toDate: normalizedTo
		})
		return { jobId: job.id, status: 'queued' }
	}

	listActivities(tenantId: string) {
		return this.prisma.tenderActivity.findMany({
			where: { tenantId },
			orderBy: { name: 'asc' }
		})
	}

	async createActivity(data: any, tenantId: string) {
		const scope = this.normalizeScope(data.scope)
		if (!scope) throw new BadRequestException('Invalid scope')
		const activity = await this.prisma.tenderActivity.create({
			data: {
				name: data.name,
				description: data.description,
				scope,
				keywords: data.keywords || [],
				negativeKeywords: data.negativeKeywords || [],
				weight: data.weight ?? undefined,
				isHighPriority: data.isHighPriority ?? false,
				isActive: data.isActive ?? true,
				tenantId
			}
		})
		await this.updateActivityEmbedding(activity)
		return activity
	}

	async updateActivity(id: string, data: any, tenantId: string) {
		const update: Prisma.TenderActivityUpdateManyMutationInput = {}
		if (data.name !== undefined) update.name = data.name
		if (data.description !== undefined) update.description = data.description
		if (data.scope !== undefined) {
			const scope = this.normalizeScope(data.scope)
			if (!scope) throw new BadRequestException('Invalid scope')
			update.scope = scope
		}
		if (data.keywords !== undefined) update.keywords = data.keywords || []
		if (data.negativeKeywords !== undefined) update.negativeKeywords = data.negativeKeywords || []
		if (data.weight !== undefined) update.weight = data.weight
		if (data.isHighPriority !== undefined) update.isHighPriority = data.isHighPriority
		if (data.isActive !== undefined) update.isActive = data.isActive

		const result = await this.prisma.tenderActivity.updateMany({
			where: { id, tenantId },
			data: update
		})
		if (!result.count) {
			throw new BadRequestException('Tender activity not found')
		}
		const activity = await this.prisma.tenderActivity.findUnique({ where: { id } })
		if (activity) {
			await this.updateActivityEmbedding(activity)
		}
		return activity
	}

	async getClassification(tenderId: string, tenantId: string) {
		const classification = await this.prisma.tenderClassification.findFirst({
			where: { tenderId, tenantId }
		})
		if (!classification) return null
		if (!classification.matchedActivityIds.length) {
			return { ...classification, matchedActivities: [] }
		}
		const activities = await this.prisma.tenderActivity.findMany({
			where: { id: { in: classification.matchedActivityIds }, tenantId }
		})
		const map = new Map(activities.map(activity => [activity.id, activity]))
		const matchedActivities = classification.matchedActivityIds
			.map(id => map.get(id))
			.filter(Boolean)
		return { ...classification, matchedActivities }
	}

	async reprocessClassifications(
		payload: { fromDate?: string; toDate?: string; portal?: string },
		tenantId: string,
		userId?: string
	) {
		const from = parseDateInput(payload.fromDate)
		let to = parseDateInput(payload.toDate, true)
		if (!payload.toDate && from) {
			const latest = await this.resolveLatestTenderDate(tenantId, payload.portal, 'created')
			if (latest) to = latest
		}
		const config = await this.loadSmartFilterConfig()
		const nextVersion = config.version + 1

		await this.prisma.appSetting.upsert({
			where: { key: SMART_FILTER_VERSION_KEY },
			update: { value: String(nextVersion) },
			create: { key: SMART_FILTER_VERSION_KEY, value: String(nextVersion) }
		})

		const run = await this.prisma.tenderClassificationRun.create({
			data: {
				runType: TenderClassificationRunType.REPROCESS,
				classificationVersion: nextVersion,
				rangeFrom: from || undefined,
				rangeTo: to || undefined,
				triggeredBy: userId,
				tenantId
			}
		})

		const where: Prisma.MinistryTenderWhereInput = { tenantId }
		if (payload.portal) where.portal = payload.portal
		if (from || to) {
			where.createdAt = {
				gte: from || undefined,
				lte: to || undefined
			}
		}

		const tenders = await this.prisma.ministryTender.findMany({ where })
		await this.ensureActivityEmbeddings(tenantId)
		await this.ensureTenderEmbeddings(tenders)
		let processed = 0
		let errors = 0
		const errorSamples: Array<{ tenderId: string; message: string }> = []
		for (const tender of tenders) {
			try {
				await this.upsertClassification(tender, tenantId, nextVersion)
				processed += 1
			} catch (err: any) {
				errors += 1
				if (errorSamples.length < 10) {
					errorSamples.push({
						tenderId: tender.id,
						message: err?.message || 'Classification failed'
					})
				}
			}
		}

		const stats = { processed, errors, errorSamples }
		await this.prisma.tenderClassificationRun.update({
			where: { id: run.id },
			data: { finishedAt: new Date(), stats }
		})

		try {
			await this.dispatchTenderRecommendations(tenantId, 'reprocess', { onlyNew: true })
		} catch (err) {
			console.warn('[tenders] Failed to send tender recommendations', err)
		}

		return { runId: run.id, ...stats }
	}

	async translateExistingTitles(
		payload: { portal?: string; fromDate?: string; toDate?: string; limit?: number; dryRun?: boolean | string },
		tenantId: string,
		triggeredBy?: string
	) {
		const where: Prisma.MinistryTenderWhereInput = { tenantId }
		const andFilters: Prisma.MinistryTenderWhereInput[] = []
		const from = parseDateInput(payload.fromDate)
		let to = parseDateInput(payload.toDate, true)
		if (!payload.toDate && from) {
			const latest = await this.resolveLatestTenderDate(tenantId, payload.portal, 'publish')
			if (latest) to = latest
		}
		if (from || to) {
			const publishRange: Prisma.DateTimeFilter = {}
			const closeRange: Prisma.DateTimeFilter = {}
			if (from) {
				publishRange.gte = from
				closeRange.gte = from
			}
			if (to) {
				publishRange.lte = to
				closeRange.lte = to
			}
			andFilters.push({
				OR: [{ publishDate: publishRange }, { closeDate: closeRange }]
			})
		}
		if (payload.portal) where.portal = payload.portal
		if (andFilters.length) {
			where.AND = andFilters
		}

		const limit = Math.min(Math.max(this.parseNumber(payload.limit) ?? 200, 1), 1000)
		const dryRun = this.parseBoolean(payload.dryRun) ?? false
		const tenders = await this.prisma.ministryTender.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: limit
		})

		const summary = {
			scanned: 0,
			translated: 0,
			skipped: 0,
			failed: 0,
			errors: [] as Array<{ tenderId: string; message: string }>
		}

		const candidates = tenders
			.map(tender => {
				const title = tender.title?.trim() || ''
				const titleOriginal = tender.titleOriginal?.trim() || ''
				const source = containsArabic(title) ? title : !title && containsArabic(titleOriginal) ? titleOriginal : null
				return source ? { tender, source } : null
			})
			.filter(Boolean) as Array<{ tender: MinistryTender; source: string }>

		summary.scanned = tenders.length
		summary.skipped = tenders.length - candidates.length

		const batchSize = Math.max(1, Math.min(Number(process.env.TRANSLATION_BATCH_SIZE || 20), 50))
		for (let i = 0; i < candidates.length; i += batchSize) {
			const batch = candidates.slice(i, i + batchSize)
			const sources = batch.map(item => item.source)
			try {
				const translations = await translateArabicBatchStrict(sources)
				for (let index = 0; index < batch.length; index += 1) {
					const { tender, source } = batch[index]
					const translation = translations[index]
					if (!dryRun) {
						await this.prisma.ministryTender.update({
							where: { id: tender.id },
							data: {
								title: translation.translated,
								titleOriginal: translation.original || source
							}
						})
					}
					summary.translated += 1
				}
			} catch (err: any) {
				for (const item of batch) {
					try {
						const translation = await translateArabicStrict(item.source)
						if (!dryRun) {
							await this.prisma.ministryTender.update({
								where: { id: item.tender.id },
								data: {
									title: translation.translated,
									titleOriginal: translation.original || item.source
								}
							})
						}
						summary.translated += 1
					} catch (singleErr: any) {
						summary.failed += 1
						if (summary.errors.length < 10) {
							summary.errors.push({
								tenderId: item.tender.id,
								message: singleErr?.message || err?.message || 'Translation failed'
							})
						}
					}
				}
			}
		}

		return {
			...summary,
			limit,
			dryRun,
			portal: payload.portal || null,
			triggeredBy: triggeredBy || null
		}
	}

	async sendRecommendations(
		payload: RecommendationCriteria,
		tenantId: string,
		userId?: string,
		role?: string
	) {
		await this.assertRecommendationAccess(userId, tenantId, role)
		return this.dispatchTenderRecommendations(tenantId, 'manual', payload)
	}

	private parseBoolean(value?: string | number | boolean) {
		if (value === undefined || value === null) return undefined
		if (typeof value === 'boolean') return value
		const raw = String(value).trim().toLowerCase()
		if (['1', 'true', 'yes', 'y'].includes(raw)) return true
		if (['0', 'false', 'no', 'n'].includes(raw)) return false
		return undefined
	}

	private parseNumber(value?: string | number) {
		if (value === undefined || value === null) return undefined
		const parsed = typeof value === 'number' ? value : Number(value)
		return Number.isFinite(parsed) ? parsed : undefined
	}

	private async assertRecommendationAccess(userId: string | undefined, tenantId: string, role?: string) {
		if (role === 'ADMIN') return
		if (!userId) {
			throw new ForbiddenException('Not authorized to send tender recommendations')
		}
		const links = await this.prisma.userBusinessRole.findMany({
			where: { userId, user: { tenantId, isActive: true } },
			include: { businessRole: true }
		})
		const names = links.map(link => link.businessRole?.name || '').filter(Boolean)
		const allowed = names.some(name => /sales|executive/i.test(name))
		if (!allowed) {
			throw new ForbiddenException('Not authorized to send tender recommendations')
		}
	}

	private parseVector(value: unknown): number[] | null {
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

	private buildTenderEmbeddingInput(tender: MinistryTender) {
		return normalizeEmbeddingInput([
			tender.title,
			tender.ministry,
			tender.requestedSectorType,
			tender.tenderType
		])
	}

	private buildActivityEmbeddingInput(activity: {
		name: string
		description?: string | null
		keywords?: string[] | null
		negativeKeywords?: string[] | null
		scope?: TenderScope
	}) {
		const keywords = (activity.keywords || []).map(entry => entry.trim()).filter(Boolean)
		const negative = (activity.negativeKeywords || []).map(entry => entry.trim()).filter(Boolean)
		const isNegative = this.isNegativeActivity({
			scope: activity.scope,
			keywords,
			negativeKeywords: negative
		})
		const parts = [activity.name, activity.description, ...(isNegative ? negative : keywords)]
		return { text: normalizeEmbeddingInput(parts), isNegative }
	}

	private isNegativeActivity(activity: {
		scope?: TenderScope
		keywords?: string[] | null
		negativeKeywords?: string[] | null
	}) {
		const positive = (activity.keywords || []).filter(Boolean)
		const negative = (activity.negativeKeywords || []).filter(Boolean)
		return activity.scope === 'OTHER' && positive.length === 0 && negative.length > 0
	}

	private async updateActivityEmbedding(activity: {
		id: string
		name: string
		description?: string | null
		keywords?: string[]
		negativeKeywords?: string[]
		scope: TenderScope
	}) {
		const input = this.buildActivityEmbeddingInput(activity)
		if (!input.text) return
		try {
			const embedding = await embedText(input.text)
			const vectorLiteral = toVectorLiteral(embedding)
			await this.prisma.$executeRaw`
				UPDATE "TenderActivity"
				SET "embedding" = ${vectorLiteral}::vector
				WHERE id = ${activity.id}
			`
		} catch (err: any) {
			throw new BadRequestException(err?.message || 'Activity embedding failed')
		}
	}

	private async ensureActivityEmbeddings(tenantId: string) {
		const missing = await this.prisma.$queryRaw<Array<{ id: string }>>`
			SELECT id
			FROM "TenderActivity"
			WHERE "tenantId" = ${tenantId}
			  AND "isActive" = true
			  AND "embedding" IS NULL
		`
		if (!missing.length) return
		const activities = await this.prisma.tenderActivity.findMany({
			where: { id: { in: missing.map(row => row.id) }, tenantId }
		})
		const pairs = activities
			.map(activity => {
				const input = this.buildActivityEmbeddingInput(activity)
				return input.text ? { activity, text: input.text } : null
			})
			.filter(Boolean) as Array<{ activity: typeof activities[number]; text: string }>
		if (!pairs.length) return
		const texts = pairs.map(pair => pair.text)
		const batchSize = Math.max(1, Math.min(Number(process.env.EMBEDDING_BATCH_SIZE || 50), 100))
		for (let i = 0; i < texts.length; i += batchSize) {
			const slice = texts.slice(i, i + batchSize)
			const vectors = await embedTexts(slice)
			for (let index = 0; index < vectors.length; index += 1) {
				const activity = pairs[i + index].activity
				const vectorLiteral = toVectorLiteral(vectors[index])
				await this.prisma.$executeRaw`
					UPDATE "TenderActivity"
					SET "embedding" = ${vectorLiteral}::vector
					WHERE id = ${activity.id}
				`
			}
		}
	}

	private async ensureTenderEmbedding(tender: MinistryTender): Promise<number[]> {
		const rows = await this.prisma.$queryRaw<Array<{ embedding: unknown }>>`
			SELECT "embedding"::text as embedding
			FROM "MinistryTender"
			WHERE id = ${tender.id}
		`
		const existing = rows[0]?.embedding
		const parsed = this.parseVector(existing)
		if (parsed) return parsed

		const text = this.buildTenderEmbeddingInput(tender)
		if (!text) {
			throw new BadRequestException('Tender embedding text is empty')
		}
		const embedding = await embedText(text)
		const vectorLiteral = toVectorLiteral(embedding)
		await this.prisma.$executeRaw`
			UPDATE "MinistryTender"
			SET "embedding" = ${vectorLiteral}::vector
			WHERE id = ${tender.id}
		`
		return embedding
	}

	private async ensureTenderEmbeddings(tenders: MinistryTender[]) {
		if (!tenders.length) return
		const ids = tenders.map(tender => tender.id)
		const rows = await this.prisma.$queryRaw<
			Array<{
				id: string
				title: string | null
				ministry: string | null
				requestedSectorType: string | null
				tenderType: string | null
			}>
		>`
			SELECT id, title, ministry, "requestedSectorType", "tenderType"
			FROM "MinistryTender"
			WHERE id IN (${Prisma.join(ids)})
			  AND "embedding" IS NULL
		`
		if (!rows.length) return
		const pairs = rows
			.map(row => ({
				row,
				text: normalizeEmbeddingInput([row.title, row.ministry, row.requestedSectorType, row.tenderType])
			}))
			.filter(pair => pair.text)
		if (!pairs.length) return
		const texts = pairs.map(pair => pair.text)
		const batchSize = Math.max(1, Math.min(Number(process.env.EMBEDDING_BATCH_SIZE || 50), 100))
		for (let i = 0; i < pairs.length; i += batchSize) {
			const sliceRows = pairs.slice(i, i + batchSize)
			const sliceTexts = texts.slice(i, i + batchSize)
			const vectors = await embedTexts(sliceTexts)
			for (let index = 0; index < vectors.length; index += 1) {
				const row = sliceRows[index].row
				const vectorLiteral = toVectorLiteral(vectors[index])
				await this.prisma.$executeRaw`
					UPDATE "MinistryTender"
					SET "embedding" = ${vectorLiteral}::vector
					WHERE id = ${row.id}
				`
			}
		}
	}

	private buildSemanticClassification(
		tender: MinistryTender,
		activityMatches: Array<{
			id: string
			name: string
			scope: TenderScope
			weight: number | null
			isHighPriority: boolean
			keywords: string[]
			negativeKeywords: string[]
			similarity: number
		}>,
		config: { newWindowHours: number; similarityThreshold: number }
	) {
		let totalScore = 0
		const scopeScores: Record<TenderScope, number> = {
			ITSQ: 0,
			IOT_SHABAKA: 0,
			OTHER: 0
		}
		const matchedActivityIds: string[] = []
		const matchedScopes = new Set<TenderScope>()
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

			const isNegative = this.isNegativeActivity(activity)
			const scoreDelta = Math.round(similarity * 100 * weight)
			if (isNegative) {
				totalScore -= scoreDelta
				scopeScores[activity.scope] -= scoreDelta
				addReason(`Negative: ${activity.name} (${similarity.toFixed(2)})`)
				continue
			}

			totalScore += scoreDelta
			scopeScores[activity.scope] += scoreDelta
			if (activity.isHighPriority) {
				totalScore += DEFAULT_HIGH_PRIORITY_BONUS
				scopeScores[activity.scope] += DEFAULT_HIGH_PRIORITY_BONUS
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
			scoreItsq: Math.max(0, Math.round(scopeScores.ITSQ)),
			scoreIotShabaka: Math.max(0, Math.round(scopeScores.IOT_SHABAKA)),
			scoreOther: Math.max(0, Math.round(scopeScores.OTHER)),
			isNew,
			matchedActivityIds,
			matchedScopes: Array.from(matchedScopes),
			matchedKeywords,
			reasons
		}
	}

	private async normalizeTenderTitle(input: { title?: string | null; titleOriginal?: string | null }) {
		const rawTitle = typeof input.title === 'string' ? input.title.trim() : input.title ?? undefined
		const rawOriginal =
			typeof input.titleOriginal === 'string' ? input.titleOriginal.trim() : input.titleOriginal ?? undefined

		if (containsArabic(rawTitle)) {
			try {
				const translated = await translateArabicStrict(rawTitle)
				return {
					title: translated.translated,
					titleOriginal: translated.original || rawTitle
				}
			} catch (err: any) {
				throw new BadRequestException(err?.message || 'Arabic title translation failed')
			}
		}

		if (!rawTitle && containsArabic(rawOriginal)) {
			try {
				const translated = await translateArabicStrict(rawOriginal)
				return {
					title: translated.translated,
					titleOriginal: translated.original || rawOriginal
				}
			} catch (err: any) {
				throw new BadRequestException(err?.message || 'Arabic title translation failed')
			}
		}

		return {
			title: rawTitle,
			titleOriginal: rawOriginal
		}
	}

	private normalizeScope(value?: string): TenderScope | null {
		if (!value) return null
		const raw = value.trim().toUpperCase()
		if (raw === 'ITSQ') return 'ITSQ'
		if (raw === 'IOT_SHABAKA' || raw === 'IOT') return 'IOT_SHABAKA'
		if (raw === 'OTHER') return 'OTHER'
		return null
	}

	private parseStringArray(value?: string) {
		if (!value) return []
		try {
			const parsed = JSON.parse(value)
			if (Array.isArray(parsed)) {
				return parsed.map(entry => String(entry)).filter(Boolean)
			}
		} catch {
			// fall through to comma split
		}
		return value
			.split(',')
			.map(entry => entry.trim())
			.filter(Boolean)
	}

	private parseScopeTokens(input?: string[] | string) {
		if (!input) return []
		if (Array.isArray(input)) {
			return input.map(entry => String(entry).trim()).filter(Boolean)
		}
		return this.parseStringArray(input)
	}

	private resolveRecommendationScopes(scopeTokens: string[], config: { groupScopes: TenderScope[] }) {
		if (!scopeTokens.length) return []
		const scopeSet = new Set<TenderScope>()
		const tokens = scopeTokens.map(entry => entry.trim().toUpperCase()).filter(Boolean)
		if (tokens.includes('GROUP')) {
			for (const scope of config.groupScopes) {
				scopeSet.add(scope)
			}
		}
		for (const raw of tokens) {
			if (raw === 'GROUP') continue
			const scope = this.normalizeScope(raw)
			if (scope) scopeSet.add(scope)
		}
		return Array.from(scopeSet)
	}

	private normalizeRecommendationCriteria(criteria: RecommendationCriteria, config: { threshold: number }) {
		const scopeTokens = this.parseScopeTokens(criteria.scopes)
		const minScore = this.parseNumber(criteria.minScore) ?? config.threshold
		const limit = Math.max(1, Math.min(this.parseNumber(criteria.limit) ?? Number(process.env.TENDER_RECOMMENDATION_LIMIT || 10), 50))
		const includePromoted = this.parseBoolean(criteria.includePromoted) ?? false
		const includeClosed = this.parseBoolean(criteria.includeClosed) ?? false
		const onlyNewRaw = this.parseBoolean(criteria.onlyNew)
		const onlyNew = onlyNewRaw === undefined ? true : onlyNewRaw
		const portal = criteria.portal?.trim() || undefined
		return { scopeTokens, minScore, limit, includePromoted, includeClosed, onlyNew, portal }
	}

	private escapeHtml(value?: string | null) {
		if (!value) return ''
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\"/g, '&quot;')
			.replace(/'/g, '&#39;')
	}

	private formatDate(value?: Date | string | null) {
		if (!value) return '-'
		const date = value instanceof Date ? value : new Date(value)
		if (Number.isNaN(date.getTime())) return '-'
		return date.toISOString().slice(0, 10)
	}

	private buildRecommendationRows(
		tenders: Array<MinistryTender & { classification: any }>,
		scoreField: string
	) {
		if (!tenders.length) {
			return `<tr><td colspan="7">No tenders met the current threshold.</td></tr>`
		}
		return tenders
			.map(tender => {
				const score =
					(tender.classification as Record<string, number> | undefined)?.[scoreField] ??
					tender.classification?.score ??
					0
				const matches = (tender.classification?.matchedKeywords || []).slice(0, 3)
				const matchText =
					matches.length > 0 ? matches.join(', ') : (tender.classification?.matchedScopes || []).join(', ')
				const purchaseUrl = tender.purchaseUrl?.trim()
				const purchaseLink = purchaseUrl
					? `<a href="${this.escapeHtml(purchaseUrl)}" target="_blank" rel="noreferrer">Link</a>`
					: '—'
				return `
					<tr>
						<td>${this.escapeHtml(tender.tenderRef || '-')}</td>
						<td>${this.escapeHtml(tender.title || '-')}</td>
						<td>${this.escapeHtml(tender.ministry || '-')}</td>
						<td>${this.formatDate(tender.closeDate)}</td>
						<td>${this.escapeHtml(String(score))}</td>
						<td>${this.escapeHtml(matchText || '-')}</td>
						<td>${purchaseLink}</td>
					</tr>
				`
			})
			.join('')
	}

	private async dispatchTenderRecommendations(
		tenantId: string,
		trigger: 'collector' | 'reprocess' | 'manual',
		criteria: RecommendationCriteria = {}
	) {
		const config = await this.loadSmartFilterConfig()
		const parsed = this.normalizeRecommendationCriteria(criteria, config)
		const scopes = this.resolveRecommendationScopes(parsed.scopeTokens, config)
		const scoreField = this.resolveScoreSortField(parsed.scopeTokens)
		const classificationWhere: Prisma.TenderClassificationWhereInput = {}
		;(classificationWhere as any)[scoreField] = { gte: parsed.minScore }
		if (parsed.onlyNew) {
			classificationWhere.isNew = true
		}
		if (scopes.length) {
			classificationWhere.matchedScopes = { hasSome: scopes }
		}
		const andFilters: Prisma.MinistryTenderWhereInput[] = []
		if (!parsed.includePromoted) {
			andFilters.push({ status: { not: 'promoted' } })
		}
		if (!parsed.includeClosed) {
			const now = new Date()
			andFilters.push({ OR: [{ closeDate: null }, { closeDate: { gte: now } }] })
		}
		if (parsed.portal) {
			andFilters.push({ portal: parsed.portal })
		}
		const where: Prisma.MinistryTenderWhereInput = {
			tenantId,
			classification: { is: classificationWhere }
		}
		if (andFilters.length) {
			where.AND = andFilters
		}
		const [items, total] = await this.prisma.$transaction([
			this.prisma.ministryTender.findMany({
				where,
				include: { classification: true },
				orderBy: [
					{ classification: { [scoreField]: 'desc' } },
					{ closeDate: 'asc' },
					{ publishDate: 'desc' }
				],
				take: parsed.limit
			}),
			this.prisma.ministryTender.count({ where })
		])
		const actionUrl = buildFrontendUrl('/tenders/available')
		const subject = total ? `Tender recommendations ready (${total})` : 'Tender recommendations ready'
		const newLabel = parsed.onlyNew ? 'new ' : ''
		const summaryText = total
			? `Showing ${Math.min(parsed.limit, total)} of ${total} ${newLabel}tenders that meet the current threshold (${parsed.minScore}).`
			: `No ${newLabel}tenders met the current threshold (${parsed.minScore}) for this ${trigger} run.`
		const bodyLines = items.map((tender, index) => {
			const label = tender.title || tender.tenderRef || 'Untitled tender'
			const score =
				(tender.classification as Record<string, number> | undefined)?.[scoreField] ??
				tender.classification?.score ??
				0
			return `${index + 1}. ${label} (score ${score})`
		})
		const body = total
			? [`Tender recommendations are ready after the ${trigger}.`, ...bodyLines].join('\n')
			: `No ${newLabel}tenders met the current threshold (${parsed.minScore}) after the ${trigger}.`
		const payload = {
			actionUrl,
			actionLabel: 'Open tenders',
			templateName: 'tender-recommendations',
			templateData: {
				SUBJECT: subject,
				HERO_HEADLINE: 'Tender recommendations ready',
				HERO_SUBTEXT: `Updated after the latest ${trigger} run.`,
				SUMMARY_TEXT: summaryText,
				TABLE_ROWS: this.buildRecommendationRows(
					items as Array<MinistryTender & { classification: any }>,
					scoreField
				),
				CTA_URL: actionUrl,
				CTA_TEXT: 'Open tenders'
			}
		}

		let recipients = await this.notifications.resolveRecipients({
			tenantId,
			activity: NotificationActivities.TENDERS_RECOMMENDED,
			includeDefaults: true
		})
		if (!recipients.length) {
			recipients = await this.prisma.user.findMany({
				where: { tenantId, isActive: true },
				select: { id: true, email: true, name: true }
			})
		}
		const userIds = recipients.map(user => user.id)
		if (!userIds.length) {
			return {
				total,
				selected: items.length,
				recipients: 0,
				created: 0,
				minScore: parsed.minScore,
				onlyNew: parsed.onlyNew,
				scopes,
				trigger
			}
		}

		const dispatchResult = await this.notifications.dispatch({
			activity: NotificationActivities.TENDERS_RECOMMENDED,
			tenantId,
			subject,
			body,
			userIds,
			payload,
			channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
		})
		return {
			total,
			selected: items.length,
			recipients: userIds.length,
			created: dispatchResult.created,
			minScore: parsed.minScore,
			onlyNew: parsed.onlyNew,
			scopes,
			trigger
		}
	}

	private resolveScoreSortField(scopeTokens: string[]) {
		const normalized = scopeTokens
			.map(token => token.trim().toUpperCase())
			.filter(Boolean)
		if (normalized.includes('GROUP')) return 'score'
		const scoped = normalized.filter(token => token !== 'GROUP')
		if (scoped.length !== 1) return 'score'
		const scope = this.normalizeScope(scoped[0])
		if (scope === 'ITSQ') return 'scoreItsq'
		if (scope === 'IOT_SHABAKA') return 'scoreIotShabaka'
		if (scope === 'OTHER') return 'scoreOther'
		return 'score'
	}

	private resolveSortOrder(
		sortBy: string | undefined,
		sortDir: string | undefined,
		scopeTokens: string[]
	): Prisma.MinistryTenderOrderByWithRelationInput[] {
		const defaultOrder: Prisma.MinistryTenderOrderByWithRelationInput[] = [
			{ closeDate: 'asc' },
			{ publishDate: 'desc' }
		]
		if (!sortBy) return defaultOrder
		const key = sortBy.trim()
		if (!key) return defaultOrder
		const dir: Prisma.SortOrder = sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc'
		switch (key) {
			case 'tenderRef':
				return [{ tenderRef: dir }, ...defaultOrder]
			case 'title':
				return [{ title: dir }, ...defaultOrder]
			case 'ministry':
				return [{ ministry: dir }, ...defaultOrder]
			case 'publishDate':
				return [{ publishDate: dir }, ...defaultOrder]
			case 'closeDate':
				return [{ closeDate: dir }, ...defaultOrder]
			case 'tenderBondValue':
				return [{ tenderBondValue: dir }, ...defaultOrder]
			case 'documentsValue':
				return [{ documentsValue: dir }, ...defaultOrder]
			case 'tenderType':
				return [{ tenderType: dir }, ...defaultOrder]
			case 'status':
				return [{ status: dir }, ...defaultOrder]
			case 'score': {
				const field = this.resolveScoreSortField(scopeTokens)
				return [{ classification: { [field]: dir } }, ...defaultOrder]
			}
			default:
				return defaultOrder
		}
	}

	private async resolveLatestTenderDate(
		tenantId: string,
		portal: string | undefined,
		mode: 'created' | 'publish'
	): Promise<Date | null> {
		if (mode === 'created') {
			const latest = await this.prisma.ministryTender.findFirst({
				where: { tenantId, ...(portal ? { portal } : {}) },
				orderBy: { createdAt: 'desc' },
				select: { createdAt: true }
			})
			return latest?.createdAt ?? null
		}

		const portalFilter = portal ? Prisma.sql` AND "portal" = ${portal}` : Prisma.sql``
		const rows = await this.prisma.$queryRaw<Array<{ max_date: Date | null }>>`
			SELECT MAX(GREATEST(COALESCE("publishDate", "createdAt"), COALESCE("closeDate", "createdAt"))) AS max_date
			FROM "MinistryTender"
			WHERE "tenantId" = ${tenantId}
			${portalFilter}
		`
		return rows[0]?.max_date ?? null
	}

	private async loadSmartFilterConfig() {
		const rows = await this.prisma.appSetting.findMany({
			where: {
				key: {
					in: [
						SMART_FILTER_THRESHOLD_KEY,
						SMART_FILTER_NEW_WINDOW_KEY,
						SMART_FILTER_GROUP_SCOPES_KEY,
						SMART_FILTER_VERSION_KEY,
						SMART_FILTER_SIMILARITY_KEY
					]
				}
			}
		})
		const map = new Map(rows.map(row => [row.key, row.value]))
		const threshold = this.parseNumber(map.get(SMART_FILTER_THRESHOLD_KEY)) ?? DEFAULT_SMART_FILTER_THRESHOLD
		const similarityThreshold =
			this.parseNumber(map.get(SMART_FILTER_SIMILARITY_KEY)) ?? DEFAULT_SIMILARITY_THRESHOLD
		const newWindowHours =
			this.parseNumber(map.get(SMART_FILTER_NEW_WINDOW_KEY)) ?? DEFAULT_SMART_FILTER_NEW_WINDOW_HOURS
		const version = Math.max(1, Math.floor(this.parseNumber(map.get(SMART_FILTER_VERSION_KEY)) ?? 1))

		let groupScopes = DEFAULT_GROUP_SCOPES
		const groupRaw = map.get(SMART_FILTER_GROUP_SCOPES_KEY)
		if (groupRaw) {
			const parsed = this.parseStringArray(groupRaw)
			const normalized = parsed
				.map(entry => this.normalizeScope(entry))
				.filter((scope): scope is TenderScope => Boolean(scope))
			if (normalized.length) {
				groupScopes = normalized
			}
		}

		return { threshold, similarityThreshold, newWindowHours, groupScopes, version }
	}

	private async upsertClassification(
		tender: MinistryTender,
		tenantId: string,
		classificationVersion?: number
	) {
		const activities = await this.prisma.tenderActivity.findMany({
			where: { tenantId, isActive: true }
		})
		const config = await this.loadSmartFilterConfig()
		const tenderEmbedding = await this.ensureTenderEmbedding(tender)
		await this.ensureActivityEmbeddings(tenantId)
		const vectorLiteral = toVectorLiteral(tenderEmbedding)
		const activityMatches = await this.prisma.$queryRaw<
			Array<{
				id: string
				name: string
				scope: TenderScope
				weight: number | null
				isHighPriority: boolean
				keywords: string[]
				negativeKeywords: string[]
				similarity: number
			}>
		>`
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
			WHERE "tenantId" = ${tenantId}
			  AND "isActive" = true
			  AND "embedding" IS NOT NULL
		`

		const result = this.buildSemanticClassification(tender, activityMatches, config)

		const version = classificationVersion ?? config.version
		return this.prisma.tenderClassification.upsert({
			where: { tenderId: tender.id },
			create: {
				tenderId: tender.id,
				classificationVersion: version,
				score: result.score,
				scoreItsq: result.scoreItsq,
				scoreIotShabaka: result.scoreIotShabaka,
				scoreOther: result.scoreOther,
				isNew: result.isNew,
				matchedActivityIds: result.matchedActivityIds,
				matchedScopes: result.matchedScopes as TenderScope[],
				matchedKeywords: result.matchedKeywords,
				reasons: result.reasons,
				tenantId
			},
			update: {
				classificationVersion: version,
				score: result.score,
				scoreItsq: result.scoreItsq,
				scoreIotShabaka: result.scoreIotShabaka,
				scoreOther: result.scoreOther,
				isNew: result.isNew,
				matchedActivityIds: result.matchedActivityIds,
				matchedScopes: result.matchedScopes as TenderScope[],
				matchedKeywords: result.matchedKeywords,
				reasons: result.reasons,
				tenantId
			}
		})
	}
}
