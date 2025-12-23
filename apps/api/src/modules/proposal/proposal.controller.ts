import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { TenantService } from '../../tenant/tenant.service'

@Controller('proposal')
@UseGuards(JwtAuthGuard)
export class ProposalController {
	constructor(private readonly prisma: PrismaService, private tenants: TenantService) {}

	@Get(':opportunityId')
	async list(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.prisma.proposalSection.findMany({
			where: { opportunityId },
			orderBy: [{ createdAt: 'asc' }]
		})
	}
}
