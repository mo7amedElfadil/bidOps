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
	@IsInt()
	@Min(0)
	maxDaysLeft?: number

	@IsOptional()
	@IsInt()
	@Min(0)
	minRank?: number
}


