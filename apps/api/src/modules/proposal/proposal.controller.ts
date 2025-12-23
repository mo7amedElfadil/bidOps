import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common'
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

	@Get(':opportunityId/export.csv')
	async export(@Param('opportunityId') opportunityId: string, @Res() res: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		const sections = await this.prisma.proposalSection.findMany({
			where: { opportunityId },
			orderBy: [{ createdAt: 'asc' }]
		})
		const headers = ['SectionNo', 'Title', 'Content', 'Meta']
		const lines = [headers.join(',')]
		for (const section of sections) {
			const line = [
				escape(section.sectionNo || ''),
				escape(section.title || ''),
				escape(section.content || ''),
				escape(JSON.stringify(section.meta || {}))
			].join(',')
			lines.push(line)
		}
		const csv = lines.join('\n')
		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', `attachment; filename="proposal-${opportunityId}.csv"`)
		res.send(csv)
	}
}

function escape(value: string) {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`
	}
	return value
}
