import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class ChecklistItemDto {
	@IsOptional()
	@IsBoolean()
	done?: boolean

	@IsOptional()
	@IsString()
	attachmentId?: string

	@IsOptional()
	@IsString()
	notes?: string
}

export class UpdateChecklistDto {
	@IsOptional()
	@ValidateNested()
	@Type(() => ChecklistItemDto)
	bondPurchased?: ChecklistItemDto

	@IsOptional()
	@ValidateNested()
	@Type(() => ChecklistItemDto)
	formsCompleted?: ChecklistItemDto

	@IsOptional()
	@ValidateNested()
	@Type(() => ChecklistItemDto)
	finalPdfReady?: ChecklistItemDto

	@IsOptional()
	@ValidateNested()
	@Type(() => ChecklistItemDto)
	portalCredentialsVerified?: ChecklistItemDto
}
