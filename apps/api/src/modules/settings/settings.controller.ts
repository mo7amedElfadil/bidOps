import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { Roles } from '../../auth/roles.decorator'

const DEFAULTS = { warn: 7, alert: 3, urgent: 1 }
const HOLIDAY_KEY = 'sla.holidays'
const RETENTION_KEY = 'retention.years'
const TIMEZONE_KEY = 'time.offsetHours'
const IMPORT_DATE_KEY = 'import.dateFormat'
const STAGE_KEY = 'opportunity.stages'
const STATUS_KEY = 'opportunity.statuses'
const DEFAULT_STAGES = [
	'Sourcing',
	'Qualification',
	'Purchase',
	'Elaboration',
	'Pricing & Approvals',
	'Submission',
	'Evaluation',
	'Outcome',
	'Closeout'
]
const DEFAULT_STATUSES = ['Open', 'Submitted', 'Won', 'Lost', 'Withdrawn', 'Cancelled']

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

	@Get('timezone')
	async getTimezone() {
		const row = await this.prisma.appSetting.findUnique({ where: { key: TIMEZONE_KEY } })
		return { offsetHours: Number(row?.value ?? 3) }
	}

	@Put('timezone')
	@Roles('ADMIN')
	async setTimezone(@Body() body: { offsetHours?: number }) {
		const offsetHours = Number(body.offsetHours ?? 3)
		await this.prisma.appSetting.upsert({
			where: { key: TIMEZONE_KEY },
			update: { value: String(offsetHours) },
			create: { key: TIMEZONE_KEY, value: String(offsetHours) }
		})
		return { offsetHours }
	}

	@Get('opportunity/stages')
	async getOpportunityStages() {
		const stages = await this.getList(STAGE_KEY, DEFAULT_STAGES)
		return { stages }
	}

	@Put('opportunity/stages')
	@Roles('ADMIN','MANAGER')
	async setOpportunityStages(@Body() body: { stages?: string[] }) {
		const stages = this.cleanList(body.stages ?? [], DEFAULT_STAGES)
		await this.prisma.appSetting.upsert({
			where: { key: STAGE_KEY },
			update: { value: JSON.stringify(stages) },
			create: { key: STAGE_KEY, value: JSON.stringify(stages) }
		})
		return { stages }
	}

	@Get('opportunity/statuses')
	async getOpportunityStatuses() {
		const statuses = await this.getList(STATUS_KEY, DEFAULT_STATUSES)
		return { statuses }
	}

	@Put('opportunity/statuses')
	@Roles('ADMIN','MANAGER')
	async setOpportunityStatuses(@Body() body: { statuses?: string[] }) {
		const statuses = this.cleanList(body.statuses ?? [], DEFAULT_STATUSES)
		await this.prisma.appSetting.upsert({
			where: { key: STATUS_KEY },
			update: { value: JSON.stringify(statuses) },
			create: { key: STATUS_KEY, value: JSON.stringify(statuses) }
		})
		return { statuses }
	}

	private async getList(key: string, fallback: string[]) {
		const row = await this.prisma.appSetting.findUnique({ where: { key } })
		if (!row?.value) return fallback
		try {
			const parsed = JSON.parse(row.value)
			return Array.isArray(parsed) ? parsed : fallback
		} catch {
			return fallback
		}
	}

	private cleanList(values: string[], fallback: string[]) {
		const cleaned = Array.from(new Set(values.map(v => (v || '').trim()).filter(Boolean)))
		return cleaned.length ? cleaned : fallback
	}

	@Get('import-date-format')
	async getImportDateFormat() {
		const row = await this.prisma.appSetting.findUnique({ where: { key: IMPORT_DATE_KEY } })
		const value = (row?.value || 'MDY').toUpperCase()
		return { format: value === 'DMY' ? 'DMY' : value === 'AUTO' ? 'AUTO' : 'MDY' }
	}

	@Put('import-date-format')
	@Roles('ADMIN')
	async setImportDateFormat(@Body() body: { format?: string }) {
		const raw = (body.format || 'MDY').toUpperCase()
		const format = raw === 'DMY' ? 'DMY' : raw === 'AUTO' ? 'AUTO' : 'MDY'
		await this.prisma.appSetting.upsert({
			where: { key: IMPORT_DATE_KEY },
			update: { value: format },
			create: { key: IMPORT_DATE_KEY, value: format }
		})
		return { format }
	}

	@Get('fx-rates')
	async listFxRates(@Req() req: any) {
		const tenantId = req.user?.tenantId || 'default'
		return this.prisma.fxRate.findMany({ where: { tenantId }, orderBy: [{ currency: 'asc' }] })
	}

	@Post('fx-rates')
	@Roles('ADMIN')
	async upsertFxRate(@Body() body: { currency: string; rateToQar: number }, @Req() req: any) {
		const tenantId = req.user?.tenantId || 'default'
		const currency = body.currency?.toUpperCase()
		if (!currency) throw new BadRequestException('currency is required')
		const rateToQar = Number(body.rateToQar)
		return this.prisma.fxRate.upsert({
			where: { currency_tenantId: { currency, tenantId } },
			update: { rateToQar },
			create: { currency, rateToQar, tenantId }
		})
	}

	@Patch('fx-rates/:id')
	@Roles('ADMIN')
	async updateFxRate(@Param('id') id: string, @Body() body: { rateToQar?: number }) {
		const rateToQar = Number(body.rateToQar)
		return this.prisma.fxRate.update({
			where: { id },
			data: { rateToQar }
		})
	}

	@Delete('fx-rates/:id')
	@Roles('ADMIN')
	async deleteFxRate(@Param('id') id: string) {
		return this.prisma.fxRate.delete({ where: { id } })
	}
}
