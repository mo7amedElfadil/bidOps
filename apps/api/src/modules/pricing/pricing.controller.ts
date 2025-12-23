import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { TenantService } from '../../tenant/tenant.service'
import { PricingService } from './pricing.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
	constructor(private svc: PricingService, private tenants: TenantService) {}

	@Get(':opportunityId/boq')
	listBoq(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.listBoq(opportunityId)
	}

	@Post(':opportunityId/boq')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	createBoq(@Param('opportunityId') opportunityId: string, @Body() body: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.createBoq(opportunityId, body)
	}

	@Patch('boq/:id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	updateBoq(@Param('id') id: string, @Body() body: any) {
		return this.svc.updateBoq(id, body)
	}

	@Delete('boq/:id')
	@Roles('MANAGER','ADMIN')
	deleteBoq(@Param('id') id: string) {
		return this.svc.deleteBoq(id)
	}

	@Get(':opportunityId/quotes')
	listQuotes(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.listQuotes(opportunityId)
	}

	@Post(':opportunityId/quotes')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	createQuote(@Param('opportunityId') opportunityId: string, @Body() body: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.createQuote(opportunityId, body)
	}

	@Patch('quotes/:id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	updateQuote(@Param('id') id: string, @Body() body: any) {
		return this.svc.updateQuote(id, body)
	}

	@Get(':opportunityId/pack-rows')
	listPackRows(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.listPackRows(opportunityId)
	}

	@Post(':opportunityId/pack-rows')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	createPackRow(@Param('opportunityId') opportunityId: string, @Body() body: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.createPackRow(opportunityId, body)
	}

	@Patch('pack-rows/:id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	updatePackRow(@Param('id') id: string, @Body() body: any) {
		return this.svc.updatePackRow(id, body)
	}

	@Delete('pack-rows/:id')
	@Roles('MANAGER','ADMIN')
	deletePackRow(@Param('id') id: string) {
		return this.svc.deletePackRow(id)
	}

	@Get('templates')
	listTemplates(@Req() req: any, @Query() query: any) {
		const tenantId = req.user?.tenantId || 'default'
		const { workspace, opportunityId } = query || {}
		return this.svc.listTemplates(tenantId, workspace, opportunityId)
	}

	@Post('templates')
	@Roles('MANAGER','ADMIN')
	createTemplate(@Body() body: any, @Req() req: any) {
		const tenantId = req.user?.tenantId || 'default'
		return this.svc.createTemplate(tenantId, body)
	}

	@Patch('templates/:id')
	@Roles('MANAGER','ADMIN')
	updateTemplate(@Param('id') id: string, @Body() body: any) {
		return this.svc.updateTemplate(id, body)
	}

	@Delete('templates/:id')
	@Roles('MANAGER','ADMIN')
	deleteTemplate(@Param('id') id: string) {
		return this.svc.deleteTemplate(id)
	}

	@Post(':opportunityId/pack/recalculate')
	@Roles('MANAGER','ADMIN')
	recalc(@Param('opportunityId') opportunityId: string, @Body() body: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.recalcPack(opportunityId, req.user?.tenantId || 'default', body)
	}
}
