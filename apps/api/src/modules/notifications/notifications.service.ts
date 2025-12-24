import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { NotificationChannel, NotificationDigestMode, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type DispatchInput = {
	activity: string
	stage?: string
	tenantId: string
	subject: string
	body: string
	userIds?: string[]
	roleIds?: string[]
	mergeRoles?: boolean
	includeDefaults?: boolean
	opportunityId?: string
	actorId?: string
	payload?: Prisma.InputJsonValue
	channels?: NotificationChannel[]
}

type PreferenceRow = {
	userId: string
	activity: string
	channel: NotificationChannel
	enabled: boolean
	digestMode: NotificationDigestMode
}

@Injectable()
export class NotificationsService {
	constructor(private prisma: PrismaService) {}

	private async getUsersByIds(ids: string[], tenantId: string) {
		if (!ids.length) return []
		return this.prisma.user.findMany({
			where: { tenantId, isActive: true, id: { in: ids } },
			select: { id: true, email: true, name: true }
		})
	}

	private async getUsersByBusinessRoles(roleIds: string[], tenantId: string) {
		if (!roleIds.length) return []
		const links = await this.prisma.userBusinessRole.findMany({
			where: {
				businessRoleId: { in: roleIds },
				user: { tenantId, isActive: true }
			},
			include: { user: true }
		})
		const map = new Map<string, { id: string; email: string; name: string }>()
		for (const link of links) {
			if (!link.user) continue
			map.set(link.user.id, {
				id: link.user.id,
				email: link.user.email,
				name: link.user.name
			})
		}
		return Array.from(map.values())
	}

	private async getDefaultRouting(tenantId: string, activity: string, stage?: string) {
		if (stage) {
			const withStage = await this.prisma.notificationRoutingDefault.findFirst({
				where: { tenantId, activity, stage }
			})
			if (withStage) return withStage
		}
		return this.prisma.notificationRoutingDefault.findFirst({
			where: { tenantId, activity, stage: null }
		})
	}

	async resolveRecipients(input: {
		tenantId: string
		activity: string
		stage?: string
		userIds?: string[]
		roleIds?: string[]
		mergeRoles?: boolean
		includeDefaults?: boolean
	}) {
		const explicitUsers = input.userIds?.filter(Boolean) || []
		const explicitRoles = input.roleIds?.filter(Boolean) || []
		let users: { id: string; email: string; name: string }[] = []

		if (explicitUsers.length) {
			users = await this.getUsersByIds(explicitUsers, input.tenantId)
			if (input.mergeRoles && explicitRoles.length) {
				const roleUsers = await this.getUsersByBusinessRoles(explicitRoles, input.tenantId)
				const merged = new Map(users.map(u => [u.id, u]))
				for (const roleUser of roleUsers) {
					merged.set(roleUser.id, roleUser)
				}
				users = Array.from(merged.values())
			}
			if (input.includeDefaults) {
				const defaults = await this.getDefaultRouting(input.tenantId, input.activity, input.stage)
				if (defaults) {
					const defaultUsers = await this.getUsersByIds(defaults.userIds || [], input.tenantId)
					const defaultRoleUsers = await this.getUsersByBusinessRoles(defaults.businessRoleIds || [], input.tenantId)
					const merged = new Map(users.map(u => [u.id, u]))
					for (const extra of [...defaultUsers, ...defaultRoleUsers]) {
						merged.set(extra.id, extra)
					}
					users = Array.from(merged.values())
				}
			}
			return users
		}

		if (explicitRoles.length) {
			return this.getUsersByBusinessRoles(explicitRoles, input.tenantId)
		}

		const defaults = await this.getDefaultRouting(input.tenantId, input.activity, input.stage)
		if (!defaults) return []
		const defaultUsers = await this.getUsersByIds(defaults.userIds || [], input.tenantId)
		const defaultRoleUsers = await this.getUsersByBusinessRoles(defaults.businessRoleIds || [], input.tenantId)
		const merged = new Map(defaultUsers.map(u => [u.id, u]))
		for (const roleUser of defaultRoleUsers) {
			merged.set(roleUser.id, roleUser)
		}
		return Array.from(merged.values())
	}

	private buildPreferenceMap(rows: PreferenceRow[]) {
		const map = new Map<string, PreferenceRow>()
		for (const row of rows) {
			map.set(`${row.userId}:${row.channel}`, row)
		}
		return map
	}

	private shouldSend(channel: NotificationChannel, pref?: PreferenceRow) {
		if (!pref) return true
		if (!pref.enabled) return false
		if (pref.digestMode === NotificationDigestMode.OFF) return false
		return true
	}

	async dispatch(input: DispatchInput) {
		const recipients = await this.resolveRecipients({
			tenantId: input.tenantId,
			activity: input.activity,
			stage: input.stage,
			userIds: input.userIds,
			roleIds: input.roleIds,
			mergeRoles: input.mergeRoles,
			includeDefaults: input.includeDefaults
		})
		if (!recipients.length) {
			return { created: 0, skipped: 'no_recipients' }
		}
		const prefRows = await this.prisma.notificationPreference.findMany({
			where: {
				userId: { in: recipients.map(r => r.id) },
				activity: input.activity
			}
		})
		const prefMap = this.buildPreferenceMap(prefRows as PreferenceRow[])
		const channels = input.channels?.length ? input.channels : [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
		const notifications: Prisma.NotificationCreateManyInput[] = []

		for (const recipient of recipients) {
			for (const channel of channels) {
				const pref = prefMap.get(`${recipient.id}:${channel}`)
				if (!this.shouldSend(channel, pref)) continue
				notifications.push({
					type: input.activity,
					channel,
					activity: input.activity,
					userId: recipient.id,
					to: channel === NotificationChannel.EMAIL ? recipient.email : undefined,
					subject: input.subject,
					body: input.body,
					payload: input.payload,
					status: channel === NotificationChannel.EMAIL ? 'pending' : 'unread',
					opportunityId: input.opportunityId,
					actorId: input.actorId,
					tenantId: input.tenantId
				})
			}
		}

		if (!notifications.length) {
			return { created: 0, skipped: 'no_channels' }
		}
		await this.prisma.notification.createMany({ data: notifications })
		return { created: notifications.length }
	}

	listForUser(userId: string, tenantId: string, query: { status?: string; page?: number; pageSize?: number }) {
		const page = Math.max(1, Number(query.page || 1))
		const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 25)))
		const skip = (page - 1) * pageSize
		const where: Prisma.NotificationWhereInput = {
			tenantId,
			userId,
			channel: NotificationChannel.IN_APP
		}
		if (query.status === 'unread') {
			where.readAt = null
		}
		return this.prisma.$transaction([
			this.prisma.notification.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: pageSize
			}),
			this.prisma.notification.count({ where })
		]).then(([items, total]) => ({ items, total, page, pageSize }))
	}

	async markRead(id: string, userId: string, tenantId: string) {
		const note = await this.prisma.notification.findUnique({ where: { id } })
		if (!note || note.userId !== userId || note.tenantId !== tenantId) {
			throw new BadRequestException('Notification not found')
		}
		return this.prisma.notification.update({
			where: { id },
			data: { readAt: new Date(), status: 'read' }
		})
	}

	async markAllRead(userId: string, tenantId: string) {
		return this.prisma.notification.updateMany({
			where: { userId, tenantId, channel: NotificationChannel.IN_APP, readAt: null },
			data: { readAt: new Date(), status: 'read' }
		})
	}

	listPreferences(userId: string) {
		return this.prisma.notificationPreference.findMany({
			where: { userId },
			orderBy: [{ activity: 'asc' }, { channel: 'asc' }]
		})
	}

	async savePreferences(userId: string, entries: Array<{
		activity: string
		channel: NotificationChannel
		enabled: boolean
		digestMode?: NotificationDigestMode
	}>) {
		const results = []
		for (const entry of entries) {
			results.push(
				await this.prisma.notificationPreference.upsert({
					where: {
						userId_activity_channel: {
							userId,
							activity: entry.activity,
							channel: entry.channel
						}
					},
					update: {
						enabled: entry.enabled,
						digestMode: entry.digestMode ?? NotificationDigestMode.INSTANT
					},
					create: {
						userId,
						activity: entry.activity,
						channel: entry.channel,
						enabled: entry.enabled,
						digestMode: entry.digestMode ?? NotificationDigestMode.INSTANT
					}
				})
			)
		}
		return results
	}

	listDefaults(tenantId: string) {
		return this.prisma.notificationRoutingDefault.findMany({
			where: { tenantId },
			orderBy: [{ activity: 'asc' }, { stage: 'asc' }]
		})
	}

	async saveDefaults(
		tenantId: string,
		entries: Array<{ activity: string; stage?: string; userIds?: string[]; businessRoleIds?: string[] }>
	) {
		const results = []
		for (const entry of entries) {
			const stage = entry.stage ?? null
			const existing = await this.prisma.notificationRoutingDefault.findFirst({
				where: { tenantId, activity: entry.activity, stage }
			})
			if (existing) {
				results.push(
					await this.prisma.notificationRoutingDefault.update({
						where: { id: existing.id },
						data: {
							userIds: entry.userIds || [],
							businessRoleIds: entry.businessRoleIds || []
						}
					})
				)
			} else {
				results.push(
					await this.prisma.notificationRoutingDefault.create({
						data: {
							tenantId,
							activity: entry.activity,
							stage,
							userIds: entry.userIds || [],
							businessRoleIds: entry.businessRoleIds || []
						}
					})
				)
			}
		}
		return results
	}

	async deleteDefault(tenantId: string, id: string) {
		const existing = await this.prisma.notificationRoutingDefault.findFirst({
			where: { id, tenantId }
		})
		if (!existing) {
			throw new NotFoundException('Default routing not found')
		}
		await this.prisma.notificationRoutingDefault.delete({ where: { id } })
		return { deleted: true }
	}
}
