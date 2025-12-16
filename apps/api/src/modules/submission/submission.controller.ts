import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { TenantService } from '../../tenant/tenant.service'
import { SubmissionService } from './submission.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

@Controller('submission')
@UseGuards(JwtAuthGuard)
export class SubmissionController {
	constructor(private svc: SubmissionService, private tenants: TenantService) {}

	@Post(':opportunityId/build')
	@Roles('MANAGER','ADMIN')
	build(@Param('opportunityId') opportunityId: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default')
		return this.svc.build(opportunityId)
	}
}


