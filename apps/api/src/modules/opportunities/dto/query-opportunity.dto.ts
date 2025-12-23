import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class QueryOpportunityDto {
	@IsOptional()
	@IsUUID()
	clientId?: string

	@IsOptional()
	@IsString()
	status?: string

	@IsOptional()
	@IsString()
	stage?: string

	@IsOptional()
	@IsString()
	q?: string

	@IsOptional()
	@IsInt()
	@Min(0)
	@Type(() => Number)
	maxDaysLeft?: number

	@IsOptional()
	@IsInt()
	@Min(0)
	@Type(() => Number)
	minRank?: number

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
