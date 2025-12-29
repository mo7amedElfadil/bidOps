import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { AiService } from './ai.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
	constructor(private readonly ai: AiService) {}

	@Post('extract')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	extract(
		@Body()
		body: {
			opportunityId: string
			attachmentIds: string[]
			prompt: string
			provider?: 'openai' | 'gemini'
			outputs?: { compliance?: boolean; clarifications?: boolean; proposal?: boolean }
		},
		@Req() req: any
	) {
		return this.ai.extract(body, req.user?.tenantId || 'default')
	}
}
