import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ClientsService } from './clients.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

class CreateClientDto {
	@IsString()
	@MaxLength(200)
	name!: string

	@IsOptional()
	@IsString()
	sector?: string

	@IsOptional()
	@IsString()
	tenantId?: string
}

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
	constructor(private readonly service: ClientsService) {}

	@Get()
	list(@Req() req: any) {
		return this.service.list(req.user?.tenantId || 'default')
	}

	@Post()
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	create(@Body() body: CreateClientDto, @Req() req: any) {
		return this.service.create(body, req.user?.tenantId || 'default')
	}
}


