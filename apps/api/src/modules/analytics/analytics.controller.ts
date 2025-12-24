import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'
import { Roles } from '../../auth/roles.decorator'

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
	constructor(private svc: AnalyticsService) {}

	@Get('export/awards.csv')
	async awards(@Res() res: any) {
		const csv = await this.svc.exportAwardsCsv()
		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', 'attachment; filename="awards.csv"')
		res.send(csv)
	}

	@Get('report-context')
	async reportContext() {
		return this.svc.generateReportContext()
	}

	@Get('export/opportunities.csv')
	async opportunities(@Req() req: any, @Res() res: any) {
		const csv = await this.svc.exportOpportunitiesCsv(req.user?.tenantId || 'default')
		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', 'attachment; filename="opportunities.csv"')
		res.send(csv)
	}

	@Get('onboarding')
	@Roles('ADMIN', 'MANAGER')
	async onboarding(@Req() req: any) {
		return this.svc.getOnboardingMetrics(req.user?.tenantId || 'default')
	}
}

