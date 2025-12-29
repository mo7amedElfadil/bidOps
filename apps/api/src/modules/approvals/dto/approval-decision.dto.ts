import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

const STATUSES = [
	'PENDING',
	'IN_REVIEW',
	'CHANGES_REQUESTED',
	'RESUBMITTED',
	'APPROVED',
	'APPROVED_WITH_CONDITIONS',
	'REJECTED'
] as const

export class ApprovalDecisionDto {
	@IsString()
	@IsIn(STATUSES)
	status!: typeof STATUSES[number]

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	comment?: string

	@IsOptional()
	@IsArray()
	attachments?: string[]

	@IsOptional()
	@IsString()
	changesRequestedDueDate?: string
}
