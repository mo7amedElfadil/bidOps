import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { TenantService } from '../../tenant/tenant.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { OutcomesService } from './outcomes.service'

@Controller('outcomes')
@UseGuards(JwtAuthGuard)
export class OutcomesController {
	constructor(private svc: OutcomesService, private tenants: TenantService) {}

	@Get(':opportunityId')
	get(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.get(opportunityId)
	}

	@Post(':opportunityId')
	@Roles('MANAGER','ADMIN')
	set(@Param('opportunityId') opportunityId: string, @Body() body: any, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.set(opportunityId, body)
	}
}


