import { prisma } from '../prisma'

export interface SlaConfig {
	warnDays: number
	alertDays: number
	urgentDays: number
}

async function getSlaConfig(): Promise<SlaConfig> {
	const defaults = { warnDays: 7, alertDays: 3, urgentDays: 1 }
	const rows = await prisma.appSetting.findMany({
		where: { key: { in: ['sla.warnDays', 'sla.alertDays', 'sla.urgentDays'] } }
	})
	const map = new Map(rows.map((r: { key: string; value: string }) => [r.key, r.value]))
	return {
		warnDays: Number(map.get('sla.warnDays') ?? process.env.SLA_WARN_DAYS ?? defaults.warnDays),
		alertDays: Number(map.get('sla.alertDays') ?? process.env.SLA_ALERT_DAYS ?? defaults.alertDays),
		urgentDays: Number(map.get('sla.urgentDays') ?? process.env.SLA_URGENT_DAYS ?? defaults.urgentDays)
	}
}

export async function slaTick() {
	const cfg = await getSlaConfig()
	const now = new Date()
	const opps = await prisma.opportunity.findMany({
		where: { submissionDate: { not: null } },
		select: { id: true, title: true, submissionDate: true }
	})
	for (const opp of opps) {
		if (!opp.submissionDate) continue
		const ms = opp.submissionDate.getTime() - now.getTime()
		const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
		let level: 'warn' | 'alert' | 'urgent' | null = null
		if (days <= cfg.urgentDays) level = 'urgent'
		else if (days <= cfg.alertDays) level = 'alert'
		else if (days <= cfg.warnDays) level = 'warn'

		if (level) {
			const subject = `[SLA ${level.toUpperCase()}] ${opp.title} due in ${days} day(s)`
			const body = `Opportunity "${opp.title}" is due on ${opp.submissionDate.toISOString().slice(0, 10)}.`
			await prisma.notification.create({
				data: {
					type: 'email',
					to: process.env.SLA_NOTIFY_TO || 'alerts@example.com',
					subject,
					body
				}
			})
		}
	}
}


