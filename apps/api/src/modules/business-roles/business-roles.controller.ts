import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { BusinessRolesService } from './business-roles.service'

@Controller('business-roles')
@UseGuards(JwtAuthGuard)
export class BusinessRolesController {
	constructor(private svc: BusinessRolesService) {}

	@Get()
	@Roles('ADMIN','MANAGER')
	list(@Req() req: any) {
		return this.svc.list(req.user?.tenantId || 'default')
	}

	@Post()
	@Roles('ADMIN')
	create(@Body() body: { name: string; description?: string }, @Req() req: any) {
		return this.svc.create(body, req.user?.tenantId || 'default')
	}

	@Patch(':id')
	@Roles('ADMIN')
	update(@Param('id') id: string, @Body() body: { name?: string; description?: string }, @Req() req: any) {
		return this.svc.update(id, body, req.user?.tenantId || 'default')
	}

	@Delete(':id')
	@Roles('ADMIN')
	remove(@Param('id') id: string, @Req() req: any) {
		return this.svc.remove(id, req.user?.tenantId || 'default')
	}
}
