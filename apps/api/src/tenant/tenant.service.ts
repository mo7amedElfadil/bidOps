import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TenantService {
	constructor(private prisma: PrismaService) {}

	async ensureOpportunityAccess(opportunityId: string, tenantId: string) {
		const opp = await this.prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { tenantId: true } })
		if (!opp || opp.tenantId !== tenantId) {
			throw new ForbiddenException('Access denied for this opportunity')
		}
	}

	async ensurePackAccess(packId: string, tenantId: string) {
		const pack = await this.prisma.pricingPack.findUnique({
			where: { id: packId },
			select: { opportunity: { select: { tenantId: true } } }
		} as any)
		const packTenant = (pack as any)?.opportunity?.tenantId
		if (!packTenant || packTenant !== tenantId) {
			throw new ForbiddenException('Access denied for this pricing pack')
		}
	}
}


