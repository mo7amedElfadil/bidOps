import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { parsePagination } from '../../utils/pagination'

@Injectable()
export class TendersService {
	constructor(private prisma: PrismaService) {}

	list(
		filters: { q?: string; portal?: string; status?: string; page?: number; pageSize?: number },
		tenantId: string
	) {
		const where: Prisma.MinistryTenderWhereInput = { tenantId }
		if (filters.portal) where.portal = filters.portal
		if (filters.status) where.status = filters.status
		if (filters.q) {
			const like = { contains: filters.q, mode: 'insensitive' as Prisma.QueryMode }
			where.OR = [
				{ tenderRef: like },
				{ title: like },
				{ ministry: like }
			]
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
		]).then(([items, total]) => ({ items, total, page, pageSize }))
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

		const opportunity = await this.prisma.opportunity.create({
			data: {
				clientId: client.id,
				title: tender.title || tender.tenderRef || 'New Opportunity',
				tenderRef: tender.tenderRef || undefined,
				sourcePortal: tender.portal,
				discoveryDate: tender.publishDate || undefined,
				tenantId
			}
		})

		await this.prisma.ministryTender.update({
			where: { id },
			data: { status: 'promoted' }
		})

		return opportunity
	}

	async triggerCollector(payload: { adapterId?: string }) {
		const url = process.env.COLLECTORS_URL || 'http://collectors:4100'
		const res = await fetch(`${url}/run-tenders`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload || {})
		})
		if (!res.ok) {
			const text = await res.text()
			throw new BadRequestException(text || 'Collector request failed')
		}
		return res.json()
	}
}
