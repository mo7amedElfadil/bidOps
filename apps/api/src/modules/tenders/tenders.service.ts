import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { enqueueTenderCollector } from '../../queues/collector.queue'
import { parsePagination } from '../../utils/pagination'
import { normalizeDateInput, parseDateInput } from '../../utils/date'

@Injectable()
export class TendersService {
	constructor(private prisma: PrismaService) {}

	list(
		filters: {
			q?: string
			portal?: string
			status?: string
			fromDate?: string
			toDate?: string
			page?: number
			pageSize?: number
		},
		tenantId: string
	) {
		const where: Prisma.MinistryTenderWhereInput = { tenantId }
		const andFilters: Prisma.MinistryTenderWhereInput[] = []
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
		if (andFilters.length) {
			where.AND = andFilters
		}
		const { page, pageSize, skip } = parsePagination(filters, 25, 200)
		return this.prisma.$transaction([
			this.prisma.ministryTender.findMany({
				where,
				orderBy: [{ closeDate: 'asc' }, { publishDate: 'desc' }],
				skip,
				take: pageSize
			}),
			this.prisma.ministryTender.count({ where })
		]).then(async ([items, total]) => {
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
		})
	}

	get(id: string) {
		return this.prisma.ministryTender.findUnique({ where: { id } })
	}

	create(data: any, tenantId: string) {
		return this.prisma.ministryTender.create({
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				title: data.title,
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
	}

	update(id: string, data: any) {
		return this.prisma.ministryTender.update({
			where: { id },
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				title: data.title,
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
		const job = await enqueueTenderCollector({
			adapterId: payload.adapterId,
			fromDate: normalizeDateInput(payload.fromDate),
			toDate: normalizeDateInput(payload.toDate)
		})
		return { jobId: job.id, status: 'queued' }
	}
}
