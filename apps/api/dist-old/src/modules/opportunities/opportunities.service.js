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
exports.OpportunitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_1 = require("../../utils/pagination");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_constants_1 = require("../notifications/notifications.constants");
const frontend_url_1 = require("../../utils/frontend-url");
let OpportunitiesService = class OpportunitiesService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    computeDaysLeft(submissionDate) {
        if (!submissionDate)
            return null;
        const date = submissionDate instanceof Date ? submissionDate : new Date(submissionDate);
        if (Number.isNaN(date.getTime()))
            return null;
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
    formatDateForEmail(value) {
        if (!value)
            return 'TBD';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime()))
            return 'TBD';
        return date.toISOString().split('T')[0];
    }
    async list(query, tenantId, userId) {
        const where = { tenantId };
        if (query.clientId)
            where.clientId = query.clientId;
        if (query.status)
            where.status = query.status;
        if (query.stage)
            where.stage = query.stage;
        if (typeof query.maxDaysLeft === 'number')
            where.daysLeft = { lte: query.maxDaysLeft };
        if (typeof query.minRank === 'number')
            where.priorityRank = { gte: query.minRank };
        const mine = query.mine === 'true' ||
            query.mine === '1' ||
            query.mine === true;
        if (mine && userId) {
            const assignedFilter = {
                OR: [
                    { ownerId: userId },
                    { bidOwners: { some: { userId } } }
                ]
            };
            const existing = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : [];
            where.AND = [...existing, assignedFilter];
        }
        const searchTerm = query.q?.trim();
        if (searchTerm) {
            const like = { contains: searchTerm, mode: 'insensitive' };
            where.OR = [
                { title: like },
                { description: like },
                { tenderRef: like },
                { sourcePortal: like },
                { dataOwner: like },
                { status: like },
                { stage: like },
                { client: { name: like } },
                {
                    bidOwners: {
                        some: {
                            user: {
                                OR: [
                                    { name: like },
                                    { email: like }
                                ]
                            }
                        }
                    }
                }
            ];
        }
        const { page, pageSize, skip } = (0, pagination_1.parsePagination)(query, 25, 200);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.opportunity.findMany({
                where,
                orderBy: [{ submissionDate: 'asc' }, { priorityRank: 'asc' }],
                include: { client: true, bidOwners: { include: { user: true } } },
                skip,
                take: pageSize
            }),
            this.prisma.opportunity.count({ where })
        ]);
        const items = rows.map(r => {
            const { client, bidOwners, startDate, ...rest } = r;
            return {
                ...rest,
                clientName: client?.name,
                bidOwners: bidOwners?.map(link => ({
                    id: link.userId,
                    name: link.user?.name,
                    email: link.user?.email
                })) || [],
                daysLeft: this.computeDaysLeft(r.submissionDate),
                startDate
            };
        });
        return { items, total, page, pageSize };
    }
    async create(input, tenantId) {
        if (!input.clientId && !input.clientName) {
            throw new common_1.BadRequestException('clientId or clientName is required');
        }
        let clientId = input.clientId;
        const { clientName, ...rest } = input;
        if (!clientId && input.clientName) {
            const name = input.clientName.trim();
            if (!name)
                throw new common_1.BadRequestException('clientName cannot be empty');
            const client = await this.prisma.client.upsert({
                where: { name_tenantId: { name, tenantId } },
                create: { name, tenantId },
                update: {}
            });
            clientId = client.id;
        }
        const submissionDate = input.submissionDate ? new Date(input.submissionDate) : undefined;
        const now = new Date();
        let startDate = now;
        if (submissionDate && startDate > submissionDate) {
            startDate = new Date(submissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        const daysLeft = this.computeDaysLeft(submissionDate ?? undefined);
        const createData = {
            client: { connect: { id: clientId } },
            title: input.title,
            description: input.description ?? null,
            tenderRef: input.tenderRef ?? null,
            boqTemplate: input.boqTemplateId ? { connect: { id: input.boqTemplateId } } : undefined,
            packTemplate: input.packTemplateId ? { connect: { id: input.packTemplateId } } : undefined,
            owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
            submissionDate,
            startDate,
            status: input.status ?? undefined,
            stage: input.stage ?? undefined,
            priorityRank: input.priorityRank ?? undefined,
            daysLeft,
            modeOfSubmission: input.modeOfSubmission ?? undefined,
            sourcePortal: input.sourcePortal ?? undefined,
            bondRequired: input.bondRequired ?? undefined,
            validityDays: input.validityDays ?? undefined,
            dataOwner: input.dataOwner ?? undefined,
            tenantId
        };
        const created = await this.prisma.opportunity.create({
            data: createData,
            include: { client: true, owner: true }
        });
        const subject = `New opportunity created: ${created.title}`;
        const body = `Opportunity "${created.title}" has been created.`;
        const bidOwnerLinks = await this.prisma.opportunityBidOwner.findMany({
            where: { opportunityId: created.id },
            select: { userId: true }
        });
        const explicitUserIds = [
            ...(created.ownerId ? [created.ownerId] : []),
            ...bidOwnerLinks.map(link => link.userId)
        ];
        const opportunityUrl = (0, frontend_url_1.buildFrontendUrl)(`/opportunity/${created.id}`);
        const templateData = {
            HERO_KICKER: 'Opportunity alert',
            HERO_HEADLINE: created.title,
            HERO_SUBTEXT: created.description ?? 'A new opportunity just entered the pipeline.',
            CTA_URL: opportunityUrl,
            CTA_TEXT: 'Open opportunity',
            BODY_INTRO_PARAGRAPH: created.client?.name
                ? `Client: ${created.client.name}`
                : 'A new opportunity just entered the pipeline.',
            BODY_DETAILS: created.description ?? 'No additional details have been provided yet.',
            OPPORTUNITY_TITLE: created.title,
            CLIENT_NAME: created.client?.name ?? 'Client',
            SUBMISSION_DATE: this.formatDateForEmail(created.submissionDate),
            DAYS_LEFT: created.daysLeft !== null && created.daysLeft !== undefined
                ? String(created.daysLeft)
                : 'TBD',
            BUSINESS_OWNER: created.owner?.name ?? created.dataOwner ?? 'Unassigned',
            SUMMARY_URL: opportunityUrl
        };
        try {
            await this.notifications.dispatch({
                activity: notifications_constants_1.NotificationActivities.OPPORTUNITY_CREATED,
                tenantId,
                subject,
                body,
                userIds: explicitUserIds,
                mergeRoles: true,
                includeDefaults: true,
                opportunityId: created.id,
                payload: {
                    actionUrl: (0, frontend_url_1.buildFrontendUrl)(`/opportunity/${created.id}`),
                    actionLabel: 'View opportunity',
                    templateName: 'opportunity-created',
                    templateData
                }
            });
        }
        catch (err) {
            console.warn('[notifications] Failed to dispatch opportunity.created', err);
        }
        return created;
    }
    async update(id, input, tenantId) {
        let clientId = input.clientId;
        const { clientName, ...rest } = input;
        if (!clientId && input.clientName) {
            const name = input.clientName.trim();
            if (!name)
                throw new common_1.BadRequestException('clientName cannot be empty');
            const client = await this.prisma.client.upsert({
                where: { name_tenantId: { name, tenantId } },
                create: { name, tenantId },
                update: {}
            });
            clientId = client.id;
        }
        const submissionDate = input.submissionDate ? new Date(input.submissionDate) : undefined;
        const daysLeft = this.computeDaysLeft(submissionDate ?? undefined);
        const updateData = {
            client: clientId ? { connect: { id: clientId } } : undefined,
            title: input.title ?? undefined,
            description: input.description ?? undefined,
            tenderRef: input.tenderRef ?? undefined,
            boqTemplate: input.boqTemplateId ? { connect: { id: input.boqTemplateId } } : undefined,
            packTemplate: input.packTemplateId ? { connect: { id: input.packTemplateId } } : undefined,
            owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
            submissionDate,
            status: input.status ?? undefined,
            stage: input.stage ?? undefined,
            priorityRank: input.priorityRank ?? undefined,
            daysLeft: daysLeft ?? undefined,
            modeOfSubmission: input.modeOfSubmission ?? undefined,
            sourcePortal: input.sourcePortal ?? undefined,
            bondRequired: input.bondRequired ?? undefined,
            validityDays: input.validityDays ?? undefined,
            dataOwner: input.dataOwner ?? undefined
        };
        return this.prisma.opportunity.update({ where: { id }, data: updateData }).then(async (updated) => {
            const resolveFields = [];
            if (input.submissionDate)
                resolveFields.push('submissionDate', 'daysLeft');
            if (input.priorityRank !== undefined)
                resolveFields.push('priorityRank');
            if (input.validityDays !== undefined)
                resolveFields.push('validityDays');
            if (input.daysLeft !== undefined)
                resolveFields.push('daysLeft');
            if (input.dataOwner !== undefined)
                resolveFields.push('ownerId');
            if (input.ownerId !== undefined)
                resolveFields.push('ownerId');
            if (resolveFields.length) {
                await this.prisma.importIssue.updateMany({
                    where: { opportunityId: updated.id, fieldName: { in: resolveFields }, resolvedAt: null },
                    data: { resolvedAt: new Date() }
                });
            }
            return updated;
        });
    }
    async setBidOwners(id, userIds, tenantId) {
        const users = await this.prisma.user.findMany({
            where: { tenantId, id: { in: userIds } },
            select: { id: true }
        });
        const validIds = users.map(user => user.id);
        const existing = await this.prisma.opportunityBidOwner.findMany({
            where: { opportunityId: id },
            select: { userId: true }
        });
        await this.prisma.$transaction([
            this.prisma.opportunityBidOwner.deleteMany({ where: { opportunityId: id } }),
            ...(validIds.length
                ? [
                    this.prisma.opportunityBidOwner.createMany({
                        data: validIds.map(userId => ({ opportunityId: id, userId }))
                    })
                ]
                : [])
        ]);
        const existingIds = new Set(existing.map(link => link.userId));
        const newlyAssigned = validIds.filter(userId => !existingIds.has(userId));
        if (newlyAssigned.length) {
            const opp = await this.prisma.opportunity.findUnique({
                where: { id },
                select: { title: true, tenantId: true }
            });
            if (opp) {
                try {
                    await this.notifications.dispatch({
                        activity: notifications_constants_1.NotificationActivities.OPPORTUNITY_CREATED,
                        tenantId,
                        subject: `Assigned as bid owner: ${opp.title}`,
                        body: `You have been added as a bid owner for "${opp.title}".`,
                        userIds: newlyAssigned,
                        opportunityId: id
                    });
                }
                catch (err) {
                    console.warn('[notifications] Failed to dispatch bid owner assignment', err);
                }
            }
        }
        await this.prisma.importIssue.updateMany({
            where: { opportunityId: id, fieldName: 'bidOwners', resolvedAt: null },
            data: { resolvedAt: new Date() }
        });
        return { userIds: validIds };
    }
    async get(id) {
        const row = await this.prisma.opportunity.findUnique({
            where: { id },
            include: { client: true, bidOwners: { include: { user: true } } }
        });
        if (!row)
            return null;
        const { client, bidOwners, ...rest } = row;
        return {
            ...rest,
            clientName: client?.name,
            bidOwners: bidOwners?.map(link => ({
                id: link.userId,
                name: link.user?.name,
                email: link.user?.email
            })) || [],
            daysLeft: this.computeDaysLeft(row.submissionDate)
        };
    }
    async delete(id) {
        return this.prisma.opportunity.delete({ where: { id } });
    }
    async getChecklist(opportunityId) {
        const checklist = await this.prisma.opportunityChecklist.findUnique({
            where: { opportunityId }
        });
        if (checklist)
            return checklist;
        return this.prisma.opportunityChecklist.create({
            data: { opportunityId }
        });
    }
    async updateChecklist(opportunityId, input, userId) {
        const current = await this.prisma.opportunityChecklist.findUnique({
            where: { opportunityId }
        });
        const notes = { ...(current?.notes || {}) };
        const applyItem = (key, fieldBase, item) => {
            const data = {};
            if (!item)
                return data;
            if (item.done !== undefined) {
                if (item.done) {
                    data[fieldBase.flag] = true;
                    data[fieldBase.at] = new Date();
                    data[fieldBase.by] = userId;
                }
                else {
                    data[fieldBase.flag] = false;
                    data[fieldBase.at] = null;
                    data[fieldBase.by] = null;
                }
            }
            if (item.attachmentId !== undefined && fieldBase.attachment) {
                data[fieldBase.attachment] = item.attachmentId || null;
            }
            if (item.notes !== undefined) {
                notes[key] = item.notes;
            }
            return data;
        };
        const updateData = {
            ...applyItem('bondPurchased', {
                flag: 'bondPurchased',
                at: 'bondPurchasedAt',
                by: 'bondPurchasedById',
                attachment: 'bondPurchaseAttachmentId'
            }, input.bondPurchased),
            ...applyItem('formsCompleted', {
                flag: 'formsCompleted',
                at: 'formsCompletedAt',
                by: 'formsCompletedById',
                attachment: 'formsAttachmentId'
            }, input.formsCompleted),
            ...applyItem('finalPdfReady', {
                flag: 'finalPdfReady',
                at: 'finalPdfReadyAt',
                by: 'finalPdfReadyById',
                attachment: 'finalPdfAttachmentId'
            }, input.finalPdfReady),
            ...applyItem('portalCredentialsVerified', {
                flag: 'portalCredentialsVerified',
                at: 'portalCredentialsVerifiedAt',
                by: 'portalCredentialsVerifiedById',
                attachment: 'portalCredentialsAttachmentId'
            }, input.portalCredentialsVerified),
            ...applyItem('complianceCreated', {
                flag: 'complianceCreated',
                at: 'complianceCreatedAt',
                by: 'complianceCreatedById',
                attachment: 'complianceCreatedAttachmentId'
            }, input.complianceCreated),
            ...applyItem('clarificationsSent', {
                flag: 'clarificationsSent',
                at: 'clarificationsSentAt',
                by: 'clarificationsSentById',
                attachment: 'clarificationsSentAttachmentId'
            }, input.clarificationsSent),
            ...applyItem('pricingApproved', {
                flag: 'pricingApproved',
                at: 'pricingApprovedAt',
                by: 'pricingApprovedById'
            }, input.pricingApproved),
        };
        if (Object.keys(notes).length) {
            updateData.notes = notes;
        }
        if (current) {
            return this.prisma.opportunityChecklist.update({
                where: { opportunityId },
                data: updateData
            });
        }
        const createData = {
            opportunityId,
            ...updateData
        };
        return this.prisma.opportunityChecklist.create({
            data: createData
        });
    }
};
exports.OpportunitiesService = OpportunitiesService;
exports.OpportunitiesService = OpportunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], OpportunitiesService);
//# sourceMappingURL=opportunities.service.js.map