import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { OpportunitiesService } from './opportunities.service'
import { CreateOpportunityDto } from './dto/create-opportunity.dto'
import { SetBidOwnersDto } from './dto/set-bid-owners.dto'
import { UpdateOpportunityDto } from './dto/update-opportunity.dto'
import { QueryOpportunityDto } from './dto/query-opportunity.dto'
import { UpdateChecklistDto } from './dto/update-checklist.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { TenantService } from '../../tenant/tenant.service'

@Controller('opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunitiesController {
	constructor(private readonly service: OpportunitiesService, private tenants: TenantService) {}

	@Get()
	list(@Query() query: QueryOpportunityDto, @Req() req: any) {
		return this.service.list(query, req.user?.tenantId || 'default')
	}

	@Post()
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	create(@Body() body: CreateOpportunityDto, @Req() req: any) {
		return this.service.create(body, req.user?.tenantId || 'default')
	}

	@Patch(':id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	update(@Param('id') id: string, @Body() body: UpdateOpportunityDto, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default')
		return this.service.update(id, body, req.user?.tenantId || 'default')
	}

	@Patch(':id/bid-owners')
	@Roles('MANAGER','ADMIN')
	setBidOwners(@Param('id') id: string, @Body() body: SetBidOwnersDto, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default')
		return this.service.setBidOwners(id, body.userIds || [], req.user?.tenantId || 'default')
	}

	@Delete(':id')
	@Roles('MANAGER','ADMIN')
	remove(@Param('id') id: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default')
		return this.service.delete(id)
	}

	@Get(':id/checklist')
	getChecklist(@Param('id') id: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default')
		return this.service.getChecklist(id)
	}

	@Patch(':id/checklist')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	updateChecklist(@Param('id') id: string, @Body() body: UpdateChecklistDto, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default')
		return this.service.updateChecklist(id, body, req.user?.id || 'unknown')
	}

	@Get(':id')
	get(@Param('id') id: string, @Req() req: any) {
		this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default')
		return this.service.get(id)
	}
}
