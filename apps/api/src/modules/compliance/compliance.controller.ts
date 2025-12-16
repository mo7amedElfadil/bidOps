import { Body, Controller, Get, Param, Patch, Post, Res, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { ComplianceService } from './compliance.service'
import { TenantService } from '../../tenant/tenant.service'

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
	constructor(private svc: ComplianceService, private tenants: TenantService) {}

	@Get(':opportunityId')
	list(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.list(opportunityId)
	}

	@Post(':opportunityId/import')
	@UseInterceptors(FileInterceptor('file'))
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	importPdf(@Param('opportunityId') opportunityId: string, @UploadedFile() file: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.importPdf(opportunityId, file)
	}

	@Patch(':id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	update(@Param('id') id: string, @Body() body: any) {
		return this.svc.update(id, body)
	}

	@Get(':opportunityId/export.csv')
	async exportCsv(@Param('opportunityId') opportunityId: string, @Res() res: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		const csv = await this.svc.exportCsv(opportunityId)
		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', `attachment; filename=\"compliance-${opportunityId}.csv\"`)
		res.send(csv)
	}
}


