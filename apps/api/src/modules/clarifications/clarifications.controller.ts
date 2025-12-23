import { Body, Controller, Get, Param, Patch, Post, Res, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { TenantService } from '../../tenant/tenant.service'
import { ClarificationsService } from './clarifications.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('clarifications')
@UseGuards(JwtAuthGuard)
export class ClarificationsController {
	constructor(private svc: ClarificationsService, private tenants: TenantService) {}

	@Get(':opportunityId')
	list(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.list(opportunityId)
	}

	@Post(':opportunityId')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	create(@Param('opportunityId') opportunityId: string, @Body() body: { questionNo: string; text: string; status?: string }, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.create(opportunityId, body)
	}

	@Post(':opportunityId/import.csv')
	@UseInterceptors(FileInterceptor('file'))
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	importCsv(@Param('opportunityId') opportunityId: string, @UploadedFile() file: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.importCsv(opportunityId, file)
	}

	@Patch('item/:id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	update(@Param('id') id: string, @Body() body: any) {
		return this.svc.update(id, body)
	}

	@Get(':opportunityId/export.csv')
	async export(@Param('opportunityId') opportunityId: string, @Res() res: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		const csv = await this.svc.exportCsv(opportunityId)
		res.setHeader('Content-Type', 'text/csv')
		res.setHeader('Content-Disposition', `attachment; filename=\"clarifications-${opportunityId}.csv\"`)
		res.send(csv)
	}
}

