import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class RequestWorkApprovalDto {
	@IsString()
	@IsNotEmpty()
	sourceTenderId!: string

	@IsOptional()
	@IsString()
	@MaxLength(500)
	comment?: string

	@IsOptional()
	@IsArray()
	attachments?: string[]

	@IsOptional()
	@IsArray()
	assignBidOwnerIds?: string[]

	@IsOptional()
	@IsArray()
	reviewerUserIds?: string[]

	@IsOptional()
	@IsArray()
	reviewerRoleIds?: string[]
}
