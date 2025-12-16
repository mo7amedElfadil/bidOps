import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SearchService } from './search.service'

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
	constructor(private search: SearchService) {}

	@Get()
	find(@Query('q') q: string, @Req() req: any) {
		return this.search.searchAttachments(q || '', req.user?.tenantId || 'default')
	}
}


