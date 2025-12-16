import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator'

export class CreateOpportunityDto {
	@IsUUID()
	clientId!: string

	@IsString()
	@MaxLength(300)
	title!: string

	@IsOptional()
	@IsString()
	description?: string

	@IsOptional()
	@IsString()
	tenderRef?: string

	@IsOptional()
	@IsDateString()
	submissionDate?: string

	@IsOptional()
	@IsString()
	status?: string

	@IsOptional()
	@IsString()
	stage?: string

	@IsOptional()
	@IsInt()
	@Min(0)
	priorityRank?: number

	@IsOptional()
	@IsInt()
	@Min(0)
	daysLeft?: number

	@IsOptional()
	@IsString()
	modeOfSubmission?: string

	@IsOptional()
	@IsBoolean()
	bondRequired?: boolean

	@IsOptional()
	@IsInt()
	@Min(0)
	validityDays?: number

	@IsOptional()
	@IsString()
	dataOwner?: string
}


