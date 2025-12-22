import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

const DEFAULTS = { warn: 7, alert: 3, urgent: 1 }
const HOLIDAY_KEY = 'sla.holidays'
const RETENTION_KEY = 'retention.years'

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

	@Get('holidays')
	async getHolidays() {
		const row = await this.prisma.appSetting.findUnique({ where: { key: HOLIDAY_KEY } })
		if (!row?.value) return { dates: [] as string[] }
		try {
			const parsed = JSON.parse(row.value)
			return { dates: Array.isArray(parsed) ? parsed : [] }
		} catch {
			return { dates: [] as string[] }
		}
	}

	@Put('holidays')
	@Roles('MANAGER','ADMIN')
	async setHolidays(@Body() body: { dates?: string[] }) {
		const dates = Array.isArray(body.dates) ? body.dates : []
		await this.prisma.appSetting.upsert({
			where: { key: HOLIDAY_KEY },
			update: { value: JSON.stringify(dates) },
			create: { key: HOLIDAY_KEY, value: JSON.stringify(dates) }
		})
		return { dates }
	}

	@Get('retention')
	async getRetention() {
		const row = await this.prisma.appSetting.findUnique({ where: { key: RETENTION_KEY } })
		return { years: Number(row?.value ?? 5) }
	}

	@Put('retention')
	@Roles('ADMIN')
	async setRetention(@Body() body: { years?: number }) {
		const years = Number(body.years ?? 5)
		await this.prisma.appSetting.upsert({
			where: { key: RETENTION_KEY },
			update: { value: String(years) },
			create: { key: RETENTION_KEY, value: String(years) }
		})
		return { years }
	}
}

