import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { ChangeRequestsService } from './change-requests.service'
import { CreateChangeRequestDto } from './dto/create-change-request.dto'
import { UpdateChangeRequestDto } from './dto/update-change-request.dto'

@Controller('change-requests')
@UseGuards(JwtAuthGuard)
export class ChangeRequestsController {
	constructor(private service: ChangeRequestsService) {}

	@Get()
	list(@Query('opportunityId') opportunityId: string | undefined, @Query('status') status: string | undefined, @Req() req: any) {
		return this.service.list({ opportunityId, status }, req.user?.tenantId || 'default')
	}

	@Post()
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	create(@Body() body: CreateChangeRequestDto, @Req() req: any) {
		return this.service.create(body, req.user?.id || 'unknown', req.user?.tenantId || 'default')
	}

	@Patch(':id')
	@Roles('MANAGER','ADMIN')
	update(@Param('id') id: string, @Body() body: UpdateChangeRequestDto) {
		return this.service.update(id, body)
	}
}
