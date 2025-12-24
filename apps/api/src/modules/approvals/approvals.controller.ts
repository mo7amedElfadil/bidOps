import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { TenantService } from '../../tenant/tenant.service'
import { ApprovalsService } from './approvals.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { RequestWorkApprovalDto } from './dto/request-work-approval.dto'
import { ApprovalDecisionDto } from './dto/approval-decision.dto'

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
	constructor(private svc: ApprovalsService, private tenants: TenantService) {}

	@Get('review')
	review(@Req() req: any) {
		return this.svc.reviewOverview(req.user?.tenantId || 'default')
	}

	@Get(':packId')
	async list(@Param('packId') packId: string, @Req() req: any) {
		await this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default')
		return this.svc.list(packId)
	}

	@Post('request')
	@Roles('MANAGER','ADMIN')
	request(@Body() body: RequestWorkApprovalDto, @Req() req: any) {
		return this.svc.requestWorkApproval(body, req.user || {})
	}

	@Post(':packId/bootstrap')
	@Roles('MANAGER','ADMIN')
	async bootstrap(@Param('packId') packId: string, @Body() body: any, @Req() req: any) {
		await this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default')
		return this.svc.bootstrap(packId, body?.chain)
	}

	@Post('decision/:id')
	// Allow all authenticated users to attempt decision; service checks authorization logic
	@Roles('MANAGER','ADMIN','CONTRIBUTOR','VIEWER')
	decision(@Param('id') id: string, @Body() body: ApprovalDecisionDto, @Req() req: any) {
		const user = req.user
		return this.svc.decision(id, user.id || 'unknown', user.role || 'VIEWER', body)
	}

	@Post(':packId/finalize')
	@Roles('MANAGER','ADMIN')
	async finalize(@Param('packId') packId: string, @Req() req: any) {
		await this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default')
		return this.svc.finalize(packId, req.user?.tenantId || 'default')
	}
}
