import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { TendersService } from './tenders.service'

class ListTendersQuery {
	@IsOptional()
	@IsString()
	q?: string

	@IsOptional()
	@IsString()
	portal?: string

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

	class CreateTenderDto {
	@IsString()
	@MaxLength(50)
	portal!: string

	@IsOptional()
	@IsString()
	tenderRef?: string

	@IsOptional()
	@IsString()
	title?: string

	@IsOptional()
	@IsString()
	ministry?: string

	@IsOptional()
	@IsString()
	publishDate?: string

	@IsOptional()
	@IsString()
	closeDate?: string

	@IsOptional()
	@IsString()
	requestedSectorType?: string

	@IsOptional()
	@IsString()
	tenderBondValue?: string

	@IsOptional()
	@IsString()
	documentsValue?: string

	@IsOptional()
	@IsString()
	tenderType?: string

	@IsOptional()
	@IsString()
	purchaseUrl?: string

	@IsOptional()
	@IsString()
	sourceUrl?: string

	@IsOptional()
	@IsString()
	status?: string
}

@Controller('tenders')
@UseGuards(JwtAuthGuard)
export class TendersController {
	constructor(private svc: TendersService) {}

	@Get()
	list(@Query() query: ListTendersQuery, @Req() req: any) {
		return this.svc.list(
			{
				q: query.q,
				portal: query.portal,
				status: query.status,
				fromDate: query.fromDate,
				toDate: query.toDate,
				page: query.page,
				pageSize: query.pageSize
			},
			req.user?.tenantId || 'default'
		)
	}

	@Get(':id')
	get(@Param('id') id: string) {
		return this.svc.get(id)
	}

	@Post()
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	create(@Body() body: CreateTenderDto, @Req() req: any) {
		return this.svc.create(body, req.user?.tenantId || 'default')
	}

	@Post('collect')
	@Roles('MANAGER','ADMIN')
	collect(@Body() body: { adapterId?: string; fromDate?: string; toDate?: string }) {
		return this.svc.triggerCollector(body)
	}

	@Patch(':id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	update(@Param('id') id: string, @Body() body: CreateTenderDto) {
		return this.svc.update(id, body)
	}

	@Delete(':id')
	@Roles('MANAGER','ADMIN')
	remove(@Param('id') id: string) {
		return this.svc.remove(id)
	}

	@Post(':id/promote')
	@Roles('MANAGER','ADMIN')
	promote(@Param('id') id: string, @Req() req: any) {
		return this.svc.promoteToOpportunity(id, req.user?.tenantId || 'default')
	}
}
