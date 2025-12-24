import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateChangeRequestDto } from './dto/create-change-request.dto'
import { UpdateChangeRequestDto } from './dto/update-change-request.dto'

@Injectable()
export class ChangeRequestsService {
	constructor(private prisma: PrismaService) {}

	list(filters: { opportunityId?: string; status?: string }, tenantId: string) {
		const where: any = { opportunity: { tenantId } }
		if (filters.opportunityId) where.opportunityId = filters.opportunityId
		if (filters.status) where.status = filters.status
		return this.prisma.changeRequest.findMany({
			where,
			orderBy: { createdAt: 'desc' }
		})
	}

	async create(dto: CreateChangeRequestDto, userId: string, tenantId: string) {
		const opp = await this.prisma.opportunity.findUnique({ where: { id: dto.opportunityId } })
		if (!opp || opp.tenantId !== tenantId) {
			throw new BadRequestException('Opportunity not found')
		}
		return this.prisma.changeRequest.create({
			data: {
				opportunityId: dto.opportunityId,
				changes: dto.changes,
				impact: dto.impact,
				requestedById: userId
			}
		})
	}

	update(id: string, dto: UpdateChangeRequestDto) {
		return this.prisma.changeRequest.update({
			where: { id },
			data: {
				status: dto.status as any,
				impact: dto.impact
			}
		})
	}
}
