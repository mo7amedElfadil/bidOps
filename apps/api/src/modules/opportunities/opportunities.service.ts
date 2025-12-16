import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOpportunityDto } from './dto/create-opportunity.dto'
import { UpdateOpportunityDto } from './dto/update-opportunity.dto'
import { QueryOpportunityDto } from './dto/query-opportunity.dto'

@Injectable()
export class OpportunitiesService {
	constructor(private readonly prisma: PrismaService) {}

	private computeDaysLeft(submissionDate?: Date | null): number | null {
		if (!submissionDate) return null
		const now = new Date()
		// difference in full days, ceiling to count partial days as full
		const diffMs = submissionDate.getTime() - now.getTime()
		return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
	}

	async list(query: QueryOpportunityDto, tenantId: string) {
		const where: Prisma.OpportunityWhereInput = { tenantId }
		if (query.clientId) where.clientId = query.clientId
		if (query.status) where.status = query.status
		if (query.stage) where.stage = query.stage
		if (typeof query.maxDaysLeft === 'number') where.daysLeft = { lte: query.maxDaysLeft }
		if (typeof query.minRank === 'number') where.priorityRank = { gte: query.minRank }
		const rows = await this.prisma.opportunity.findMany({
			where,
			orderBy: [{ submissionDate: 'asc' }, { priorityRank: 'asc' }]
		})

		// Recompute daysLeft for freshness on read
		return rows.map(r => ({
			...r,
			daysLeft: this.computeDaysLeft(r.submissionDate)
		}))
	}

	async create(input: CreateOpportunityDto, tenantId: string) {
		const daysLeft = this.computeDaysLeft(input.submissionDate as any)
		return this.prisma.opportunity.create({ data: { ...input, daysLeft, tenantId } })
	}

	async update(id: string, input: UpdateOpportunityDto) {
		const daysLeft = this.computeDaysLeft(input.submissionDate as any)
		return this.prisma.opportunity.update({
			where: { id },
			data: { ...input, daysLeft: daysLeft ?? undefined }
		})
	}

	async delete(id: string) {
		return this.prisma.opportunity.delete({ where: { id } })
	}
}


