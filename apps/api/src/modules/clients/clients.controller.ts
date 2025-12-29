import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
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

class ListClientsQuery {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page?: number

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	pageSize?: number
}

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
	constructor(private readonly service: ClientsService) {}

	@Get()
	list(@Req() req: any, @Query() query: ListClientsQuery) {
		return this.service.list(req.user?.tenantId || 'default', query)
	}

	@Post()
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	create(@Body() body: CreateClientDto, @Req() req: any) {
		return this.service.create(body, req.user?.tenantId || 'default')
	}
}
