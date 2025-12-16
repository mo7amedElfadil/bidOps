import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

const DEFAULTS = { warn: 7, alert: 3, urgent: 1 }

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get('sla')
	async getSla() {
		const keys = ['sla.warnDays', 'sla.alertDays', 'sla.urgentDays'] as const
		const rows = await this.prisma.appSetting.findMany({ where: { key: { in: keys as any } } })
		const map = new Map(rows.map(r => [r.key, r.value]))
		return {
			warnDays: Number(map.get('sla.warnDays') ?? process.env.SLA_WARN_DAYS ?? DEFAULTS.warn),
			alertDays: Number(map.get('sla.alertDays') ?? process.env.SLA_ALERT_DAYS ?? DEFAULTS.alert),
			urgentDays: Number(map.get('sla.urgentDays') ?? process.env.SLA_URGENT_DAYS ?? DEFAULTS.urgent)
		}
	}

	@Put('sla')
	@Roles('MANAGER','ADMIN')
	async setSla(@Body() body: { warnDays?: number; alertDays?: number; urgentDays?: number }) {
		const payload = {
			warnDays: body.warnDays ?? DEFAULTS.warn,
			alertDays: body.alertDays ?? DEFAULTS.alert,
			urgentDays: body.urgentDays ?? DEFAULTS.urgent
		}
		await this.prisma.$transaction([
			this.prisma.appSetting.upsert({
				where: { key: 'sla.warnDays' },
				update: { value: String(payload.warnDays) },
				create: { key: 'sla.warnDays', value: String(payload.warnDays) }
			}),
			this.prisma.appSetting.upsert({
				where: { key: 'sla.alertDays' },
				update: { value: String(payload.alertDays) },
				create: { key: 'sla.alertDays', value: String(payload.alertDays) }
			}),
			this.prisma.appSetting.upsert({
				where: { key: 'sla.urgentDays' },
				update: { value: String(payload.urgentDays) },
				create: { key: 'sla.urgentDays', value: String(payload.urgentDays) }
			})
		])
		return payload
	}
}


