"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsersByIds(ids, tenantId) {
        if (!ids.length)
            return [];
        return this.prisma.user.findMany({
            where: { tenantId, isActive: true, id: { in: ids } },
            select: { id: true, email: true, name: true }
        });
    }
    async getUsersByBusinessRoles(roleIds, tenantId) {
        if (!roleIds.length)
            return [];
        const links = await this.prisma.userBusinessRole.findMany({
            where: {
                businessRoleId: { in: roleIds },
                user: { tenantId, isActive: true }
            },
            include: { user: true }
        });
        const map = new Map();
        for (const link of links) {
            if (!link.user)
                continue;
            map.set(link.user.id, {
                id: link.user.id,
                email: link.user.email,
                name: link.user.name
            });
        }
        return Array.from(map.values());
    }
    async getDefaultRouting(tenantId, activity, stage) {
        if (stage) {
            const withStage = await this.prisma.notificationRoutingDefault.findFirst({
                where: { tenantId, activity, stage }
            });
            if (withStage)
                return withStage;
        }
        return this.prisma.notificationRoutingDefault.findFirst({
            where: { tenantId, activity, stage: null }
        });
    }
    async resolveRecipients(input) {
        const explicitUsers = input.userIds?.filter(Boolean) || [];
        const explicitRoles = input.roleIds?.filter(Boolean) || [];
        let users = [];
        if (explicitUsers.length) {
            users = await this.getUsersByIds(explicitUsers, input.tenantId);
            if (input.mergeRoles && explicitRoles.length) {
                const roleUsers = await this.getUsersByBusinessRoles(explicitRoles, input.tenantId);
                const merged = new Map(users.map(u => [u.id, u]));
                for (const roleUser of roleUsers) {
                    merged.set(roleUser.id, roleUser);
                }
                users = Array.from(merged.values());
            }
            if (input.includeDefaults) {
                const defaults = await this.getDefaultRouting(input.tenantId, input.activity, input.stage);
                if (defaults) {
                    const defaultUsers = await this.getUsersByIds(defaults.userIds || [], input.tenantId);
                    const defaultRoleUsers = await this.getUsersByBusinessRoles(defaults.businessRoleIds || [], input.tenantId);
                    const merged = new Map(users.map(u => [u.id, u]));
                    for (const extra of [...defaultUsers, ...defaultRoleUsers]) {
                        merged.set(extra.id, extra);
                    }
                    users = Array.from(merged.values());
                }
            }
            return users;
        }
        if (explicitRoles.length) {
            return this.getUsersByBusinessRoles(explicitRoles, input.tenantId);
        }
        const defaults = await this.getDefaultRouting(input.tenantId, input.activity, input.stage);
        if (!defaults)
            return [];
        const defaultUsers = await this.getUsersByIds(defaults.userIds || [], input.tenantId);
        const defaultRoleUsers = await this.getUsersByBusinessRoles(defaults.businessRoleIds || [], input.tenantId);
        const merged = new Map(defaultUsers.map(u => [u.id, u]));
        for (const roleUser of defaultRoleUsers) {
            merged.set(roleUser.id, roleUser);
        }
        return Array.from(merged.values());
    }
    buildPreferenceMap(rows) {
        const map = new Map();
        for (const row of rows) {
            map.set(`${row.userId}:${row.channel}`, row);
        }
        return map;
    }
    shouldSend(channel, pref) {
        if (!pref)
            return true;
        if (!pref.enabled)
            return false;
        if (pref.digestMode === client_1.NotificationDigestMode.OFF)
            return false;
        return true;
    }
    async dispatch(input) {
        const recipients = await this.resolveRecipients({
            tenantId: input.tenantId,
            activity: input.activity,
            stage: input.stage,
            userIds: input.userIds,
            roleIds: input.roleIds,
            mergeRoles: input.mergeRoles,
            includeDefaults: input.includeDefaults
        });
        if (!recipients.length) {
            return { created: 0, skipped: 'no_recipients' };
        }
        const prefRows = await this.prisma.notificationPreference.findMany({
            where: {
                userId: { in: recipients.map(r => r.id) },
                activity: input.activity
            }
        });
        const prefMap = this.buildPreferenceMap(prefRows);
        const channels = input.channels?.length ? input.channels : [client_1.NotificationChannel.EMAIL, client_1.NotificationChannel.IN_APP];
        const notifications = [];
        for (const recipient of recipients) {
            for (const channel of channels) {
                const pref = prefMap.get(`${recipient.id}:${channel}`);
                if (!this.shouldSend(channel, pref))
                    continue;
                notifications.push({
                    type: input.activity,
                    channel,
                    activity: input.activity,
                    userId: recipient.id,
                    to: channel === client_1.NotificationChannel.EMAIL ? recipient.email : undefined,
                    subject: input.subject,
                    body: input.body,
                    payload: input.payload,
                    status: channel === client_1.NotificationChannel.EMAIL ? 'pending' : 'unread',
                    opportunityId: input.opportunityId,
                    actorId: input.actorId,
                    tenantId: input.tenantId
                });
            }
        }
        if (!notifications.length) {
            return { created: 0, skipped: 'no_channels' };
        }
        await this.prisma.notification.createMany({ data: notifications });
        return { created: notifications.length };
    }
    listForUser(userId, tenantId, query) {
        const page = Math.max(1, Number(query.page || 1));
        const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 25)));
        const skip = (page - 1) * pageSize;
        const where = {
            tenantId,
            userId,
            channel: client_1.NotificationChannel.IN_APP
        };
        if (query.status === 'unread') {
            where.readAt = null;
        }
        return this.prisma.$transaction([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.notification.count({ where })
        ]).then(([items, total]) => ({ items, total, page, pageSize }));
    }
    async markRead(id, userId, tenantId) {
        const note = await this.prisma.notification.findUnique({ where: { id } });
        if (!note || note.userId !== userId || note.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { readAt: new Date(), status: 'read' }
        });
    }
    async markUnread(id, userId, tenantId) {
        const note = await this.prisma.notification.findUnique({ where: { id } });
        if (!note || note.userId !== userId || note.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { readAt: null, status: 'unread' }
        });
    }
    async markAllRead(userId, tenantId) {
        return this.prisma.notification.updateMany({
            where: { userId, tenantId, channel: client_1.NotificationChannel.IN_APP, readAt: null },
            data: { readAt: new Date(), status: 'read' }
        });
    }
    async countForUser(userId, tenantId) {
        return this.prisma.notification.count({
            where: { userId, tenantId, channel: client_1.NotificationChannel.IN_APP, readAt: null }
        });
    }
    listPreferences(userId) {
        return this.prisma.notificationPreference.findMany({
            where: { userId },
            orderBy: [{ activity: 'asc' }, { channel: 'asc' }]
        });
    }
    async savePreferences(userId, entries) {
        const results = [];
        for (const entry of entries) {
            results.push(await this.prisma.notificationPreference.upsert({
                where: {
                    userId_activity_channel: {
                        userId,
                        activity: entry.activity,
                        channel: entry.channel
                    }
                },
                update: {
                    enabled: entry.enabled,
                    digestMode: entry.digestMode ?? client_1.NotificationDigestMode.INSTANT
                },
                create: {
                    userId,
                    activity: entry.activity,
                    channel: entry.channel,
                    enabled: entry.enabled,
                    digestMode: entry.digestMode ?? client_1.NotificationDigestMode.INSTANT
                }
            }));
        }
        return results;
    }
    listDefaults(tenantId) {
        return this.prisma.notificationRoutingDefault.findMany({
            where: { tenantId },
            orderBy: [{ activity: 'asc' }, { stage: 'asc' }]
        });
    }
    async saveDefaults(tenantId, entries) {
        const results = [];
        for (const entry of entries) {
            const stage = entry.stage ?? null;
            const existing = await this.prisma.notificationRoutingDefault.findFirst({
                where: { tenantId, activity: entry.activity, stage }
            });
            if (existing) {
                results.push(await this.prisma.notificationRoutingDefault.update({
                    where: { id: existing.id },
                    data: {
                        userIds: entry.userIds || [],
                        businessRoleIds: entry.businessRoleIds || []
                    }
                }));
            }
            else {
                results.push(await this.prisma.notificationRoutingDefault.create({
                    data: {
                        tenantId,
                        activity: entry.activity,
                        stage,
                        userIds: entry.userIds || [],
                        businessRoleIds: entry.businessRoleIds || []
                    }
                }));
            }
        }
        return results;
    }
    async deleteDefault(tenantId, id) {
        const existing = await this.prisma.notificationRoutingDefault.findFirst({
            where: { id, tenantId }
        });
        if (!existing) {
            throw new common_1.NotFoundException('Default routing not found');
        }
        await this.prisma.notificationRoutingDefault.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map