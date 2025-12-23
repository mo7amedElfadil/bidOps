import { IsArray, IsUUID } from 'class-validator'

export class SetBidOwnersDto {
	@IsArray()
	@IsUUID('all', { each: true })
	userIds!: string[]
}
