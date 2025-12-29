import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateChangeRequestDto {
	@IsString()
	@IsNotEmpty()
	opportunityId!: string

	@IsString()
	@IsNotEmpty()
	@MaxLength(2000)
	changes!: string

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	impact?: string
}
