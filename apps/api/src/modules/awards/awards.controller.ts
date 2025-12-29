import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { AwardsService } from './awards.service'

class ListStagingQuery {
	@IsOptional()
	@IsString()
	q?: string

	@IsOptional()
	@IsString()
	status?: string

	@IsOptional()
	@IsString()
	fromDate?: string

	@IsOptional()
	@IsString()
	toDate?: string

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

class ListEventsQuery {
	@IsOptional()
	@IsString()
	q?: string

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

@Controller('awards')
@UseGuards(JwtAuthGuard)
export class AwardsController {
	constructor(private svc: AwardsService) {}

	@Get('staging')
	staging(@Query() query: ListStagingQuery) {
		return this.svc.listStaging(query)
	}

	@Post('staging')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	createStaging(@Body() body: any) {
		return this.svc.createStaging(body)
	}

	@Patch('staging/:id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	updateStaging(@Param('id') id: string, @Body() body: any) {
		return this.svc.updateStaging(id, body)
	}

	@Delete('staging/:id')
	@Roles('MANAGER','ADMIN')
	removeStaging(@Param('id') id: string) {
		return this.svc.deleteStaging(id)
	}

	@Post('staging/:id/curate')
	@Roles('MANAGER','ADMIN')
	curate(@Param('id') id: string) {
		return this.svc.curate(id)
	}

	@Post('collect')
	@Roles('MANAGER','ADMIN')
	collect(@Body() body: { adapterId?: string; fromDate?: string; toDate?: string }) {
		return this.svc.triggerCollector(body)
	}

	@Get('events')
	events(@Query() query: ListEventsQuery) {
		return this.svc.listEvents(query)
	}

	@Patch('events/:id')
	@Roles('MANAGER','ADMIN')
	updateEvent(@Param('id') id: string, @Body() body: any) {
		return this.svc.updateEvent(id, body)
	}

	@Delete('events/:id')
	@Roles('MANAGER','ADMIN')
	removeEvent(@Param('id') id: string) {
		return this.svc.deleteEvent(id)
	}
}
