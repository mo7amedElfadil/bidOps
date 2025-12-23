import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsEmail,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min
} from 'class-validator'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { UsersService } from './users.service'

class ListUsersQuery {
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

class CreateUserDto {
	@IsEmail()
	email!: string

	@IsOptional()
	@IsString()
	@MaxLength(200)
	name?: string

	@IsOptional()
	@IsString()
	role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'

	@IsOptional()
	@IsString()
	team?: string

	@IsOptional()
	@IsString()
	password?: string

	@IsOptional()
	@IsBoolean()
	isActive?: boolean

	@IsOptional()
	@IsString()
	@MaxLength(100)
	userType?: string
}

class UpdateUserDto {
	@IsOptional()
	@IsString()
	@MaxLength(200)
	name?: string

	@IsOptional()
	@IsString()
	role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'

	@IsOptional()
	@IsString()
	team?: string

	@IsOptional()
	@IsString()
	password?: string

	@IsOptional()
	@IsBoolean()
	isActive?: boolean

	@IsOptional()
	@IsString()
	@MaxLength(100)
	userType?: string
}

class BulkDeleteUsersDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID('4', { each: true })
	ids!: string[]
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(private svc: UsersService) {}

	@Get()
	@Roles('ADMIN','MANAGER')
	list(@Query() query: ListUsersQuery, @Req() req: any) {
		return this.svc.list(
			{ q: query.q, page: query.page, pageSize: query.pageSize },
			req.user?.tenantId || 'default'
		)
	}

	@Get(':id')
	@Roles('ADMIN')
	get(@Param('id') id: string) {
		return this.svc.get(id)
	}

	@Post()
	@Roles('ADMIN','MANAGER')
	create(@Body() body: CreateUserDto, @Req() req: any) {
		return this.svc.create({ ...body, tenantId: req.user?.tenantId || 'default' })
	}

	@Patch(':id')
	@Roles('ADMIN')
	update(@Param('id') id: string, @Body() body: UpdateUserDto) {
		return this.svc.update(id, body)
	}

	@Delete()
	@Roles('ADMIN')
	bulkRemove(@Body() body: BulkDeleteUsersDto) {
		return this.svc.deleteMany(body.ids)
	}

	@Delete(':id')
	@Roles('ADMIN')
	remove(@Param('id') id: string) {
		return this.svc.delete(id)
	}
}
