import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { NotificationChannel, NotificationDigestMode } from '@prisma/client'
import { NotificationsService } from './notifications.service'

class ListNotificationsQuery {
	@IsOptional()
	@IsString()
	status?: string

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

class PreferenceDto {
	@IsString()
	activity!: string

	@IsString()
	@IsIn(['EMAIL', 'IN_APP'])
	channel!: NotificationChannel

	@IsOptional()
	@IsIn(['INSTANT', 'DAILY', 'WEEKLY', 'OFF'])
	digestMode?: NotificationDigestMode

	@IsBoolean()
	@Type(() => Boolean)
	enabled!: boolean
}

class SavePreferencesDto {
	@IsArray()
	items!: PreferenceDto[]
}

class DefaultRoutingDto {
	@IsString()
	activity!: string

	@IsOptional()
	@IsString()
	stage?: string

	@IsOptional()
	@IsArray()
	userIds?: string[]

	@IsOptional()
	@IsArray()
	businessRoleIds?: string[]
}

class SaveDefaultsDto {
	@IsArray()
	items!: DefaultRoutingDto[]
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(private svc: NotificationsService) {}

	@Get()
	list(@Query() query: ListNotificationsQuery, @Req() req: any) {
		return this.svc.listForUser(req.user?.id, req.user?.tenantId || 'default', query)
	}

	@Patch(':id/read')
	markRead(@Param('id') id: string, @Req() req: any) {
		return this.svc.markRead(id, req.user?.id, req.user?.tenantId || 'default')
	}

	@Post('read-all')
	markAllRead(@Req() req: any) {
		return this.svc.markAllRead(req.user?.id, req.user?.tenantId || 'default')
	}

	@Get('preferences')
	preferences(@Req() req: any) {
		return this.svc.listPreferences(req.user?.id)
	}

	@Patch('preferences')
	savePreferences(@Body() body: SavePreferencesDto, @Req() req: any) {
		const items = body.items || []
		const payload = items.map(item => ({
			activity: item.activity,
			channel: item.channel as NotificationChannel,
			digestMode: item.digestMode as NotificationDigestMode | undefined,
			enabled: item.enabled
		}))
		return this.svc.savePreferences(req.user?.id, payload)
	}

	@Get('defaults')
	@Roles('ADMIN')
	listDefaults(@Req() req: any) {
		return this.svc.listDefaults(req.user?.tenantId || 'default')
	}

	@Patch('defaults')
	@Roles('ADMIN')
	saveDefaults(@Body() body: SaveDefaultsDto, @Req() req: any) {
		return this.svc.saveDefaults(req.user?.tenantId || 'default', body.items || [])
	}
}
