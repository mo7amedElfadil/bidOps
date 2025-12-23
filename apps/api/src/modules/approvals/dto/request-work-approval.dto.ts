import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class RequestWorkApprovalDto {
	@IsString()
	@IsNotEmpty()
	sourceTenderId!: string

	@IsOptional()
	@IsString()
	@MaxLength(500)
	comment?: string
}
