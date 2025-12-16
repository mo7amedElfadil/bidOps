import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { TenantService } from '../../tenant/tenant.service'
import { ApprovalsService } from './approvals.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
	constructor(private svc: ApprovalsService, private tenants: TenantService) {}

	@Get(':packId')
	list(@Param('packId') packId: string, @Req() req: any) {
		this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default')
		return this.svc.list(packId)
	}

	@Post(':packId/bootstrap')
	@Roles('MANAGER','ADMIN')
	bootstrap(@Param('packId') packId: string, @Body() body: any, @Req() req: any) {
		this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default')
		return this.svc.bootstrap(packId, body?.chain)
	}

	@Post('decision/:id')
	// Allow all authenticated users to attempt decision; service checks authorization logic
	@Roles('MANAGER','ADMIN','CONTRIBUTOR','VIEWER')
	decision(@Param('id') id: string, @Body() body: { status: 'APPROVED'|'REJECTED'; remarks?: string }, @Req() req: any) {
		const user = req.user
		return this.svc.decision(id, user.id || 'unknown', user.role || 'VIEWER', body)
	}
}
