import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'
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
	scope?: string

	@IsOptional()
	@IsString()
	scopes?: string

	@IsOptional()
	@IsInt()
	@Min(0)
	@Type(() => Number)
	minScore?: number

	@IsOptional()
	@IsString()
	isNew?: string

	@IsOptional()
	@IsString()
	promoted?: string

	@IsOptional()
	@IsString()
	goNoGoStatus?: string

	@IsOptional()
	@IsString()
	fromDate?: string

	@IsOptional()
	@IsString()
	toDate?: string

	@IsOptional()
	@IsString()
	sortBy?: string

	@IsOptional()
	@IsString()
	sortDir?: string

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

class CreateTenderActivityDto {
	@IsString()
	@MaxLength(120)
	name!: string

	@IsOptional()
	@IsString()
	description?: string

	@IsString()
	scope!: string

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	keywords?: string[]

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	negativeKeywords?: string[]

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	weight?: number

	@IsOptional()
	@IsBoolean()
	isHighPriority?: boolean

	@IsOptional()
	@IsBoolean()
	isActive?: boolean
}

class UpdateTenderActivityDto {
	@IsOptional()
	@IsString()
	@MaxLength(120)
	name?: string

	@IsOptional()
	@IsString()
	description?: string

	@IsOptional()
	@IsString()
	scope?: string

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	keywords?: string[]

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	negativeKeywords?: string[]

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	weight?: number

	@IsOptional()
	@IsBoolean()
	isHighPriority?: boolean

	@IsOptional()
	@IsBoolean()
	isActive?: boolean
}

class ReprocessTenderClassificationDto {
	@IsOptional()
	@IsString()
	fromDate?: string

	@IsOptional()
	@IsString()
	toDate?: string

	@IsOptional()
	@IsString()
	portal?: string
}

class TranslateTenderTitlesDto {
	@IsOptional()
	@IsString()
	fromDate?: string

	@IsOptional()
	@IsString()
	toDate?: string

	@IsOptional()
	@IsString()
	portal?: string

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	limit?: number

	@IsOptional()
	@IsBoolean()
	dryRun?: boolean
}

class SendTenderRecommendationsDto {
	@IsOptional()
	@IsString()
	scopes?: string

	@IsOptional()
	@IsInt()
	@Min(0)
	@Type(() => Number)
	minScore?: number

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	limit?: number

	@IsOptional()
	@IsBoolean()
	includePromoted?: boolean

	@IsOptional()
	@IsBoolean()
	includeClosed?: boolean

	@IsOptional()
	@IsBoolean()
	onlyNew?: boolean

	@IsOptional()
	@IsString()
	portal?: string
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
	titleOriginal?: string

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
	@Type(() => String)
	tenderBondValue?: string

	@IsOptional()
	@IsString()
	@Type(() => String)
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

class UpdateTenderDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	portal?: string

	@IsOptional()
	@IsString()
	tenderRef?: string

	@IsOptional()
	@IsString()
	title?: string

	@IsOptional()
	@IsString()
	titleOriginal?: string

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
	@Type(() => String)
	tenderBondValue?: string

	@IsOptional()
	@IsString()
	@Type(() => String)
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
				scope: query.scope,
				scopes: query.scopes,
				minScore: query.minScore,
				isNew: query.isNew,
				promoted: query.promoted,
				goNoGoStatus: query.goNoGoStatus,
				fromDate: query.fromDate,
				toDate: query.toDate,
				sortBy: query.sortBy,
				sortDir: query.sortDir,
				page: query.page,
				pageSize: query.pageSize
			},
			req.user?.tenantId || 'default'
		)
	}

	@Get('activities')
	listActivities(@Req() req: any) {
		return this.svc.listActivities(req.user?.tenantId || 'default')
	}

	@Post('activities')
	@Roles('ADMIN')
	createActivity(@Body() body: CreateTenderActivityDto, @Req() req: any) {
		return this.svc.createActivity(body, req.user?.tenantId || 'default')
	}

	@Patch('activities/:id')
	@Roles('ADMIN')
	updateActivity(@Param('id') id: string, @Body() body: UpdateTenderActivityDto, @Req() req: any) {
		return this.svc.updateActivity(id, body, req.user?.tenantId || 'default')
	}

	@Post('reprocess')
	@Roles('ADMIN')
	reprocess(@Body() body: ReprocessTenderClassificationDto, @Req() req: any) {
		return this.svc.reprocessClassifications(body, req.user?.tenantId || 'default', req.user?.id)
	}

	@Post('translate')
	@Roles('ADMIN')
	translateTitles(@Body() body: TranslateTenderTitlesDto, @Req() req: any) {
		return this.svc.translateExistingTitles(body, req.user?.tenantId || 'default', req.user?.id)
	}

	@Post('recommendations')
	sendRecommendations(@Body() body: SendTenderRecommendationsDto, @Req() req: any) {
		return this.svc.sendRecommendations(body, req.user?.tenantId || 'default', req.user?.id, req.user?.role)
	}

	@Get(':id/classification')
	getClassification(@Param('id') id: string, @Req() req: any) {
		return this.svc.getClassification(id, req.user?.tenantId || 'default')
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

	@Get(':id')
	get(@Param('id') id: string) {
		return this.svc.get(id)
	}

	@Patch(':id')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	update(@Param('id') id: string, @Body() body: UpdateTenderDto) {
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
