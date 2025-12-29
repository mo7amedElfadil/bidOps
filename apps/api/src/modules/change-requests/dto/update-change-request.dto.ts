import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

const STATUSES = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'] as const

export class UpdateChangeRequestDto {
	@IsOptional()
	@IsString()
	@IsIn(STATUSES)
	status?: typeof STATUSES[number]

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	impact?: string
}
