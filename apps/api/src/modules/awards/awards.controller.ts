import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'
import { AwardsService } from './awards.service'

@Controller('awards')
@UseGuards(JwtAuthGuard)
export class AwardsController {
	constructor(private svc: AwardsService) {}

	@Get('staging')
	staging() {
		return this.svc.listStaging()
	}

	@Post('staging')
	@Roles('MANAGER','ADMIN','CONTRIBUTOR')
	createStaging(@Body() body: any) {
		return this.svc.createStaging(body)
	}

	@Post('staging/:id/curate')
	@Roles('MANAGER','ADMIN')
	curate(@Param('id') id: string) {
		return this.svc.curate(id)
	}

	@Post('collect')
	@Roles('MANAGER','ADMIN')
	collect(@Body() body: { adapterId?: string; fromDate?: string; toDate?: string }) {
		return this.svc.triggerCollector(body)
	}

	@Get('events')
	events() {
		return this.svc.listEvents()
	}
}

