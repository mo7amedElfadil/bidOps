import { NotificationChannel, NotificationDigestMode, Prisma } from '@prisma/client'
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
		select: { id: true, title: true, submissionDate: true, slaLastNotifiedLevel: true, slaLastNotifiedAt: true, tenantId: true }
	})
	for (const opp of opps) {
		if (!opp.submissionDate) continue
		const ms = opp.submissionDate.getTime() - now.getTime()
		const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
		let level: 'warn' | 'alert' | 'urgent' | null = null
		if (days <= cfg.urgentDays) level = 'urgent'
		else if (days <= cfg.alertDays) level = 'alert'
		else if (days <= cfg.warnDays) level = 'warn'

		if (!level || days < 0) continue
		if (opp.slaLastNotifiedLevel === level && opp.slaLastNotifiedAt) {
			const hoursSince = (now.getTime() - opp.slaLastNotifiedAt.getTime()) / (1000 * 60 * 60)
			if (hoursSince < 24) continue
		}

		const routing = await prisma.notificationRoutingDefault.findUnique({
			where: { tenantId_activity_stage: { tenantId: opp.tenantId || 'default', activity: 'sla', stage: null } }
		})
		const directUserIds = routing?.userIds || []
		const roleIds = routing?.businessRoleIds || []
		type RoleLink = Prisma.UserBusinessRoleGetPayload<{ include: { user: true } }>
		const roleLinks: RoleLink[] = roleIds.length
			? await prisma.userBusinessRole.findMany({
					where: { businessRoleId: { in: roleIds }, user: { tenantId: opp.tenantId || 'default', isActive: true } },
					include: { user: true }
				})
			: []
		const roleUserIds = roleLinks.map((link: RoleLink) => link.userId)
		const recipientIds = Array.from(new Set([...directUserIds, ...roleUserIds]))
		const recipients = recipientIds.length
			? await prisma.user.findMany({
					where: { id: { in: recipientIds }, tenantId: opp.tenantId || 'default', isActive: true },
					select: { id: true, email: true }
				})
			: []

		const prefRows: Prisma.NotificationPreferenceGetPayload<{}>[] = recipientIds.length
			? await prisma.notificationPreference.findMany({
					where: { userId: { in: recipientIds }, activity: 'sla' }
				})
			: []
		const prefMap = new Map(prefRows.map(row => [`${row.userId}:${row.channel}`, row]))

		const subject = `[SLA ${level.toUpperCase()}] ${opp.title} due in ${days} day(s)`
		const body = `Opportunity "${opp.title}" is due on ${opp.submissionDate.toISOString().slice(0, 10)}.`
		const notifications: Prisma.NotificationCreateManyInput[] = []

		for (const recipient of recipients) {
			for (const channel of [NotificationChannel.EMAIL, NotificationChannel.IN_APP]) {
				const pref = prefMap.get(`${recipient.id}:${channel}`)
				if (pref && (!pref.enabled || pref.digestMode === NotificationDigestMode.OFF)) continue
				notifications.push({
					type: 'sla',
					channel,
					activity: 'sla',
					userId: recipient.id,
					to: channel === NotificationChannel.EMAIL ? recipient.email : undefined,
					subject,
					body,
					status: channel === NotificationChannel.EMAIL ? 'pending' : 'unread',
					opportunityId: opp.id,
					tenantId: opp.tenantId || 'default'
				})
			}
		}

		if (!notifications.length) {
			continue
		}

		await prisma.$transaction([
			prisma.notification.createMany({ data: notifications }),
			prisma.opportunity.update({
				where: { id: opp.id },
				data: { slaLastNotifiedLevel: level, slaLastNotifiedAt: now }
			})
		])
	}
}
