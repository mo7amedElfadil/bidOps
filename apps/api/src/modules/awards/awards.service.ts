import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { enqueueAwardCollector, enqueueTenderCollector } from '../../queues/collector.queue'
import { parsePagination } from '../../utils/pagination'
import { normalizeDateInput, parseDateInput } from '../../utils/date'

type StagingFilters = {
	fromDate?: string
	toDate?: string
	q?: string
	status?: string
	page?: number
	pageSize?: number
}

@Injectable()
export class AwardsService {
	constructor(private prisma: PrismaService) {}

	listStaging(filters: StagingFilters = {}) {
		const where: Prisma.AwardStagingWhereInput = {}
		if (filters.status && filters.status !== 'all') {
			where.status = filters.status
		}
		if (filters.fromDate || filters.toDate) {
			const from = parseDateInput(filters.fromDate)
			const to = parseDateInput(filters.toDate, true)
			where.awardDate = {}
			if (from) where.awardDate.gte = from
			if (to) where.awardDate.lte = to
		}
		if (filters.q?.trim()) {
			const term = filters.q.trim()
			const like = { contains: term, mode: 'insensitive' as Prisma.QueryMode }
			where.OR = [
				{ portal: like },
				{ tenderRef: like },
				{ client: like },
				{ title: like },
				{ status: like },
				{ sourceUrl: like },
				{ notes: like }
			]
		}
		const { page, pageSize, skip } = parsePagination(filters, 25, 200)
		return this.prisma.$transaction([
			this.prisma.awardStaging.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: pageSize
			}),
			this.prisma.awardStaging.count({ where })
		]).then(([items, total]) => ({ items, total, page, pageSize }))
	}

	createStaging(data: any) {
		return this.prisma.awardStaging.create({
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				client: data.client ?? data.buyer,
				title: data.title,
				titleOriginal: data.titleOriginal,
				closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
				awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
				winners: Array.isArray(data.winners) ? data.winners : (data.winners ? String(data.winners).split(',').map((w: string) => w.trim()).filter(Boolean) : []),
				awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
				codes: Array.isArray(data.codes) ? data.codes : (data.codes ? String(data.codes).split(',').map((c: string) => c.trim()).filter(Boolean) : []),
				notes: data.notes,
				rawPath: data.rawPath,
				sourceUrl: data.sourceUrl,
				status: data.status || 'new'
			}
		})
	}

	updateStaging(id: string, data: any) {
		return this.prisma.awardStaging.update({
			where: { id },
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				client: data.client ?? data.buyer,
				title: data.title,
				titleOriginal: data.titleOriginal,
				closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
				awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
				winners: Array.isArray(data.winners)
					? data.winners
					: data.winners
						? String(data.winners).split(',').map((w: string) => w.trim()).filter(Boolean)
						: undefined,
				awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
				codes: Array.isArray(data.codes)
					? data.codes
					: data.codes
						? String(data.codes).split(',').map((c: string) => c.trim()).filter(Boolean)
						: undefined,
				notes: data.notes,
				rawPath: data.rawPath,
				sourceUrl: data.sourceUrl,
				status: data.status
			}
		})
	}

	deleteStaging(id: string) {
		return this.prisma.awardStaging.delete({ where: { id } })
	}

	async curate(id: string) {
		const row = await this.prisma.awardStaging.findUnique({ where: { id } })
		if (!row) return null
		const event = await this.prisma.awardEvent.create({
			data: {
				portal: row.portal,
				tenderRef: row.tenderRef || undefined,
				client: row.client || undefined,
				title: row.title || undefined,
				titleOriginal: row.titleOriginal || undefined,
				awardDate: row.awardDate || undefined,
				winners: row.winners,
				awardValue: row.awardValue || undefined,
				codes: row.codes,
				sourceUrl: row.sourceUrl || undefined
			}
		})
		await this.prisma.awardStaging.update({ where: { id }, data: { status: 'curated' } })
		return event
	}

	listEvents(query: { page?: number; pageSize?: number; q?: string } = {}) {
		const where: Prisma.AwardEventWhereInput = {}
		if (query.q?.trim()) {
			const term = query.q.trim()
			const like = { contains: term, mode: 'insensitive' as Prisma.QueryMode }
			where.OR = [
				{ portal: like },
				{ tenderRef: like },
				{ client: like },
				{ title: like },
				{ sourceUrl: like }
			]
		}
		const { page, pageSize, skip } = parsePagination(query, 25, 200)
		return this.prisma.$transaction([
			this.prisma.awardEvent.findMany({
				orderBy: { awardDate: 'desc' },
				skip,
				take: pageSize
			}),
			this.prisma.awardEvent.count()
		]).then(([items, total]) => ({ items, total, page, pageSize }))
	}

	updateEvent(id: string, data: any) {
		return this.prisma.awardEvent.update({
			where: { id },
			data: {
				portal: data.portal,
				tenderRef: data.tenderRef,
				client: data.client ?? data.buyer,
				title: data.title,
				titleOriginal: data.titleOriginal,
				awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
				winners: Array.isArray(data.winners)
					? data.winners
					: data.winners
						? String(data.winners).split(',').map((w: string) => w.trim()).filter(Boolean)
						: undefined,
				awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
				codes: Array.isArray(data.codes)
					? data.codes
					: data.codes
						? String(data.codes).split(',').map((c: string) => c.trim()).filter(Boolean)
						: undefined,
				sourceUrl: data.sourceUrl
			}
		})
	}

	deleteEvent(id: string) {
		return this.prisma.awardEvent.delete({ where: { id } })
	}

	async triggerCollector(payload: { adapterId?: string; fromDate?: string; toDate?: string }) {
		const today = new Date().toISOString().slice(0, 10)
		const normalizedFrom = normalizeDateInput(payload.fromDate)
		const normalizedTo = normalizeDateInput(payload.toDate) || today
		const job = await enqueueAwardCollector({
			adapterId: payload.adapterId,
			fromDate: normalizedFrom,
			toDate: normalizedTo
		})
		return { jobId: job.id, status: 'queued' }
	}

	async triggerTenderCollector(payload: { adapterId?: string }) {
		const job = await enqueueTenderCollector(payload)
		return { jobId: job.id, status: 'queued' }
	}
}
