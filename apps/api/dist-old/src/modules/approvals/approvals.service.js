"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const frontend_url_1 = require("../../utils/frontend-url");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_constants_1 = require("../notifications/notifications.constants");
const stageOrderMap = {
    GO_NO_GO: 1,
    WORKING: 2,
    PRICING: 3,
    FINAL_SUBMISSION: 4,
    LEGAL: 2,
    FINANCE: 3,
    EXECUTIVE: 4
};
const pendingStatuses = new Set([
    'PENDING',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'RESUBMITTED'
]);
const stageLabelMap = {
    GO_NO_GO: 'Go/No-Go',
    WORKING: 'Working',
    PRICING: 'Pricing',
    FINAL_SUBMISSION: 'Final submission',
    LEGAL: 'Working',
    FINANCE: 'Pricing',
    EXECUTIVE: 'Final submission'
};
const actionLabelMap = {
    LEGAL: 'Approve Working Stage',
    FINANCE: 'Approve Pricing Stage',
    EXECUTIVE: 'Approve Final Submission'
};
const statusLabelMap = {
    APPROVED: 'Approved',
    APPROVED_WITH_CONDITIONS: 'Approved with conditions',
    CHANGES_REQUESTED: 'Changes requested',
    REJECTED: 'Rejected',
    RESUBMITTED: 'Resubmitted',
    PENDING: 'Pending',
    IN_REVIEW: 'In review'
};
const statusClassMap = {
    APPROVED: 'status-approved',
    APPROVED_WITH_CONDITIONS: 'status-approved',
    PENDING: 'status-flagged',
    CHANGES_REQUESTED: 'status-flagged',
    REJECTED: 'status-flagged',
    RESUBMITTED: 'status-approved',
    IN_REVIEW: 'status-flagged'
};
function getStageLabel(stage, type) {
    return stageLabelMap[stage || ''] ?? stageLabelMap[type || ''] ?? 'Approval';
}
function getActionLabel(type) {
    return actionLabelMap[type || ''] ?? 'Approve';
}
function getStageOrderScore(approval) {
    return stageOrderMap[approval.stage || approval.type || ''] ?? 99;
}
let ApprovalsService = class ApprovalsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    list(packId) {
        return this.prisma.approval.findMany({
            where: { packId },
            orderBy: [{ createdAt: 'asc' }]
        });
    }
    async reviewOverview(tenantId, user, scope) {
        const packs = await this.prisma.pricingPack.findMany({
            where: {
                opportunity: {
                    tenantId
                }
            },
            include: {
                opportunity: {
                    include: {
                        client: true
                    }
                },
                approvals: true
            },
            orderBy: [{ updatedAt: 'desc' }]
        });
        const userId = user?.id;
        if (scope !== 'mine' || !userId) {
            return packs.map(pack => this.enrichPack(pack));
        }
        const roleLinks = await this.prisma.userBusinessRole.findMany({
            where: { userId: user.id },
            include: { businessRole: true }
        });
        const roleIds = roleLinks.map(link => link.businessRoleId);
        const roleNames = roleLinks.map(link => link.businessRole?.name).filter(Boolean);
        const userRole = user.role;
        const pendingStatuses = new Set(['PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED']);
        return packs
            .map(pack => this.enrichPack(pack))
            .filter(pack => pack.approvals?.some((approval) => {
            if (!pendingStatuses.has(approval.status))
                return false;
            if (approval.approverId && approval.approverId === userId)
                return true;
            if (approval.approverIds?.length && approval.approverIds.includes(userId))
                return true;
            if (approval.approverRole) {
                if (roleIds.includes(approval.approverRole))
                    return true;
                if (roleNames.includes(approval.approverRole))
                    return true;
                if (userRole && userRole === approval.approverRole)
                    return true;
            }
            return false;
        }));
    }
    enrichPack(pack) {
        const approvals = (pack.approvals || []).slice().sort((a, b) => {
            return getStageOrderScore(a) - getStageOrderScore(b);
        });
        const nextApproval = approvals.filter((approval) => pendingStatuses.has(approval.status))[0] || null;
        const nextStageLabel = nextApproval ? getStageLabel(nextApproval.stage, nextApproval.type) : null;
        const nextActionLabel = nextApproval ? getActionLabel(nextApproval.type) : null;
        const blockedReason = nextApproval ? `Waiting for ${nextStageLabel}` : null;
        const allApproved = approvals.length > 0 &&
            approvals.every((approval) => ['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(approval.status));
        const hasRejected = approvals.some((approval) => approval.status === 'REJECTED');
        return {
            ...pack,
            approvals,
            nextApproval,
            nextStageLabel,
            nextActionLabel,
            blockedReason,
            readyToFinalize: allApproved && !hasRejected && approvals.length > 0
        };
    }
    async requestWorkApproval(dto, user) {
        const tender = await this.prisma.ministryTender.findUnique({
            where: { id: dto.sourceTenderId }
        });
        if (!tender)
            throw new common_1.BadRequestException('Tender not found');
        const tenantId = user.tenantId || 'default';
        const clientName = tender.ministry?.trim() || tender.title || tender.tenderRef || 'Unknown buyer';
        const client = await this.prisma.client.upsert({
            where: { name_tenantId: { name: clientName, tenantId } },
            create: { name: clientName, tenantId },
            update: {}
        });
        let opportunity = await this.prisma.opportunity.findFirst({
            where: {
                sourceTenderId: tender.id,
                tenantId
            }
        });
        if (!opportunity) {
            opportunity = await this.prisma.opportunity.create({
                data: {
                    clientId: client.id,
                    title: tender.title || tender.tenderRef || 'New Opportunity',
                    tenderRef: tender.tenderRef ?? undefined,
                    sourcePortal: tender.portal,
                    sourceTenderId: tender.id,
                    discoveryDate: tender.publishDate || undefined,
                    tenantId,
                    goNoGoStatus: 'PENDING'
                }
            });
        }
        else {
            await this.prisma.opportunity.update({
                where: { id: opportunity.id },
                data: { goNoGoStatus: 'PENDING', goNoGoUpdatedAt: new Date() }
            });
        }
        let pack = await this.prisma.pricingPack.findFirst({
            where: { opportunityId: opportunity.id },
            orderBy: { version: 'desc' }
        });
        if (!pack) {
            pack = await this.prisma.pricingPack.create({
                data: { opportunityId: opportunity.id, version: 1 }
            });
        }
        const approval = await this.prisma.approval.create({
            data: {
                packId: pack.id,
                type: 'LEGAL',
                stage: 'GO_NO_GO',
                status: 'PENDING',
                requestedAt: new Date(),
                comment: dto.comment || undefined,
                attachments: dto.attachments ?? [],
                sourceTenderId: tender.id
            }
        });
        const reviewerUserIds = dto.reviewerUserIds?.filter(Boolean) || [];
        const reviewerRoleIds = dto.reviewerRoleIds?.filter(Boolean) || [];
        const resolvedRecipients = await this.notifications.resolveRecipients({
            tenantId,
            activity: notifications_constants_1.NotificationActivities.REVIEW_REQUESTED,
            stage: 'GO_NO_GO',
            userIds: reviewerUserIds,
            roleIds: reviewerRoleIds
        });
        if (resolvedRecipients.length) {
            await this.prisma.approval.update({
                where: { id: approval.id },
                data: {
                    approverIds: resolvedRecipients.map(r => r.id)
                }
            });
        }
        if (dto.assignBidOwnerIds?.length) {
            const users = await this.prisma.user.findMany({
                where: { tenantId, id: { in: dto.assignBidOwnerIds } },
                select: { id: true }
            });
            const validIds = users.map(u => u.id);
            if (validIds.length) {
                await this.prisma.opportunityBidOwner.createMany({
                    data: validIds.map(userId => ({ opportunityId: opportunity.id, userId })),
                    skipDuplicates: true
                });
            }
        }
        try {
            const reviewUrl = (0, frontend_url_1.buildFrontendUrl)(`/opportunity/${opportunity.id}/approvals`);
            const daysLeftLabel = opportunity.daysLeft !== null && opportunity.daysLeft !== undefined
                ? String(opportunity.daysLeft)
                : 'TBD';
            const templateData = {
                HERO_KICKER: 'Review requested',
                HERO_HEADLINE: 'Go/No-Go decision needed',
                HERO_SUBTEXT: opportunity.description ?? opportunity.title,
                OPPORTUNITY_TITLE: opportunity.title,
                DAYS_LEFT: daysLeftLabel,
                BODY_DETAILS: dto.comment
                    ? `Comment: ${dto.comment}`
                    : 'No additional notes were supplied.',
                CTA_URL: reviewUrl,
                CTA_TEXT: 'Review Go/No-Go'
            };
            await this.notifications.dispatch({
                activity: notifications_constants_1.NotificationActivities.REVIEW_REQUESTED,
                stage: 'GO_NO_GO',
                tenantId,
                subject: `Review requested: ${opportunity.title}`,
                body: `A Go/No-Go review has been requested for "${opportunity.title}".`,
                userIds: reviewerUserIds,
                roleIds: reviewerRoleIds,
                opportunityId: opportunity.id,
                actorId: user.id,
                payload: {
                    actionUrl: reviewUrl,
                    actionLabel: 'Review Go/No-Go',
                    templateName: 'approval-request',
                    templateData
                }
            });
        }
        catch (err) {
            console.warn('[notifications] Failed to dispatch review.requested', err);
        }
        return { opportunity, packId: pack.id, approvalId: approval.id };
    }
    async rejectWorkApproval(dto, user) {
        const tender = await this.prisma.ministryTender.findUnique({
            where: { id: dto.sourceTenderId }
        });
        if (!tender)
            throw new common_1.BadRequestException('Tender not found');
        const tenantId = user.tenantId || 'default';
        const clientName = tender.ministry?.trim() || tender.title || tender.tenderRef || 'Unknown buyer';
        const client = await this.prisma.client.upsert({
            where: { name_tenantId: { name: clientName, tenantId } },
            create: { name: clientName, tenantId },
            update: {}
        });
        let opportunity = await this.prisma.opportunity.findFirst({
            where: {
                sourceTenderId: tender.id,
                tenantId
            }
        });
        if (!opportunity) {
            opportunity = await this.prisma.opportunity.create({
                data: {
                    clientId: client.id,
                    title: tender.title || tender.tenderRef || 'New Opportunity',
                    tenderRef: tender.tenderRef ?? undefined,
                    sourcePortal: tender.portal,
                    sourceTenderId: tender.id,
                    discoveryDate: tender.publishDate || undefined,
                    tenantId,
                    goNoGoStatus: 'REJECTED',
                    goNoGoUpdatedAt: new Date()
                }
            });
        }
        else {
            await this.prisma.opportunity.update({
                where: { id: opportunity.id },
                data: { goNoGoStatus: 'REJECTED', goNoGoUpdatedAt: new Date() }
            });
        }
        let pack = await this.prisma.pricingPack.findFirst({
            where: { opportunityId: opportunity.id },
            orderBy: { version: 'desc' }
        });
        if (!pack) {
            pack = await this.prisma.pricingPack.create({
                data: { opportunityId: opportunity.id, version: 1 }
            });
        }
        const existingApproval = await this.prisma.approval.findFirst({
            where: { packId: pack.id, stage: 'GO_NO_GO' },
            orderBy: { createdAt: 'desc' }
        });
        const timestamp = new Date();
        const updateData = {
            status: 'REJECTED',
            comment: dto.comment || undefined,
            remarks: dto.comment || undefined,
            decidedAt: timestamp,
            signedOn: timestamp,
            approverId: user.id || undefined
        };
        if (existingApproval) {
            await this.prisma.approval.update({
                where: { id: existingApproval.id },
                data: updateData
            });
            return { opportunity, packId: pack.id, approvalId: existingApproval.id };
        }
        const approval = await this.prisma.approval.create({
            data: {
                packId: pack.id,
                type: 'LEGAL',
                stage: 'GO_NO_GO',
                status: 'REJECTED',
                requestedAt: timestamp,
                decidedAt: timestamp,
                signedOn: timestamp,
                comment: dto.comment || undefined,
                remarks: dto.comment || undefined,
                approverId: user.id || undefined,
                sourceTenderId: tender.id
            }
        });
        return { opportunity, packId: pack.id, approvalId: approval.id };
    }
    async bootstrap(packId, chain) {
        const steps = chain || [
            { type: 'LEGAL', role: 'Project Manager', stage: 'PRICING' },
            { type: 'FINANCE', role: 'Bid Manager', stage: 'PRICING' },
            { type: 'EXECUTIVE', role: 'Executive', stage: 'FINAL_SUBMISSION' }
        ];
        await this.prisma.approval.deleteMany({ where: { packId, status: 'PENDING' } });
        const pack = await this.prisma.pricingPack.findUnique({
            where: { id: packId },
            select: { opportunity: { select: { tenantId: true } } }
        });
        const tenantId = pack?.opportunity?.tenantId || 'default';
        const approvalsData = [];
        for (const step of steps) {
            let approverIds = [];
            if (step.userId) {
                approverIds = [step.userId];
            }
            else if (step.role) {
                const roleMatches = await this.prisma.businessRole.findMany({
                    where: { tenantId, OR: [{ id: step.role }, { name: step.role }] }
                });
                const roleIds = roleMatches.map(role => role.id);
                if (roleIds.length) {
                    const roleUsers = await this.notifications.resolveRecipients({
                        tenantId,
                        activity: notifications_constants_1.NotificationActivities.REVIEW_REQUESTED,
                        stage: step.stage,
                        roleIds
                    });
                    approverIds = roleUsers.map(user => user.id);
                }
            }
            approvalsData.push({
                packId,
                type: step.type,
                stage: step.stage || 'PRICING',
                approverId: step.userId,
                approverIds,
                approverRole: step.role
            });
        }
        if (approvalsData.length) {
            await this.prisma.approval.createMany({ data: approvalsData });
        }
        return this.list(packId);
    }
    async finalize(packId, tenantId, userId) {
        const pack = await this.prisma.pricingPack.findUnique({
            where: { id: packId },
            include: { opportunity: true }
        });
        if (!pack)
            throw new common_1.BadRequestException('Pricing pack not found');
        if (pack.opportunity.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Access denied');
        }
        const allApprovals = await this.prisma.approval.findMany({ where: { packId } });
        if (!allApprovals.length) {
            throw new common_1.BadRequestException('No approvals configured for this pack');
        }
        if (allApprovals.some(a => !['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status))) {
            throw new common_1.BadRequestException('All approvals must be approved before finalizing');
        }
        await this.prisma.opportunity.update({
            where: { id: pack.opportunityId },
            data: {
                stage: 'Submission',
                status: 'Ready for submission'
            }
        });
        await this.markPricingApproved(pack.opportunityId, userId);
        try {
            const tenantId = pack.opportunity?.tenantId || 'default';
            const actionUrl = (0, frontend_url_1.buildFrontendUrl)(`/opportunity/${pack.opportunityId}/submission`);
            const finalizer = userId
                ? await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
                : null;
            const finalTemplateData = {
                STATUS_LABEL: 'Finalized',
                STATUS_CLASS: 'status-approved',
                HERO_HEADLINE: 'Final approval captured',
                HERO_SUBTEXT: 'All required approvals are complete and ready for submission.',
                STAGE_LABEL: 'Final submission',
                OPPORTUNITY_TITLE: pack.opportunity?.title || 'Opportunity',
                APPROVER_NAME: finalizer?.name || 'System',
                DECISION_COMMENT: 'Submission checklist is ready',
                DECISION_DATE: new Date().toISOString().split('T')[0],
                CTA_URL: actionUrl,
                CTA_TEXT: 'Review submission readiness'
            };
            await this.notifications.dispatch({
                activity: notifications_constants_1.NotificationActivities.FINALIZATION_COMPLETED,
                stage: 'FINAL_SUBMISSION',
                tenantId,
                subject: `Bid ready: ${pack.opportunity?.title || 'Opportunity'}`,
                body: `Approvals finalized for ${pack.opportunity?.title || 'Opportunity'}.`,
                opportunityId: pack.opportunityId,
                actorId: userId,
                includeDefaults: true,
                payload: {
                    actionUrl,
                    actionLabel: 'Review submission readiness',
                    templateName: 'approval-decision',
                    templateData: finalTemplateData
                }
            });
        }
        catch (err) {
            console.warn('[notifications] Failed to dispatch finalization', err);
        }
        return { packId };
    }
    async markPricingApproved(opportunityId, userId) {
        const payload = {
            opportunity: { connect: { id: opportunityId } },
            pricingApproved: true,
            pricingApprovedAt: new Date(),
            pricingApprovedById: userId || undefined
        };
        await this.prisma.opportunityChecklist.upsert({
            where: { opportunityId },
            update: {
                pricingApproved: true,
                pricingApprovedAt: new Date(),
                pricingApprovedById: userId || undefined
            },
            create: payload
        });
    }
    async decision(id, userId, userRole, body) {
        const approval = await this.prisma.approval.findUnique({
            where: { id },
            include: { pack: { include: { opportunity: { include: { client: true } } } } }
        });
        if (!approval)
            throw new common_1.BadRequestException('Approval not found');
        let authorized = false;
        if (approval.approverId && approval.approverId === userId) {
            authorized = true;
        }
        else if (approval.approverIds?.length && approval.approverIds.includes(userId)) {
            authorized = true;
        }
        else if (approval.approverRole) {
            const roles = await this.prisma.userBusinessRole.findMany({
                where: { userId },
                include: { businessRole: true }
            });
            const match = roles.some(link => link.businessRole?.id === approval.approverRole || link.businessRole?.name === approval.approverRole);
            if (match)
                authorized = true;
            else if (userRole === approval.approverRole)
                authorized = true;
        }
        if (!authorized) {
            if (userRole === 'ADMIN')
                authorized = true;
            else
                throw new common_1.BadRequestException('Not authorized to sign this approval');
        }
        const stageOrder = ['GO_NO_GO', 'WORKING', 'PRICING', 'FINAL_SUBMISSION'];
        const currentStageIndex = stageOrder.indexOf(approval.stage);
        if (currentStageIndex > 0 && ['IN_REVIEW', 'APPROVED', 'APPROVED_WITH_CONDITIONS', 'CHANGES_REQUESTED', 'RESUBMITTED'].includes(body.status)) {
            const previousStage = stageOrder[currentStageIndex - 1];
            const previousApprovals = await this.prisma.approval.findMany({
                where: { packId: approval.packId, stage: previousStage }
            });
            if (previousApprovals.length && previousApprovals.some(a => !['APPROVED', 'APPROVED_WITH_CONDITIONS'].includes(a.status))) {
                throw new common_1.BadRequestException(`Cannot act on ${approval.stage} before ${previousStage} approvals are completed`);
            }
        }
        const timestamp = new Date();
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = `${id}:${body.status}:${timestamp.toISOString()}:${userId}`;
        const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const updateData = {
            status: body.status,
            comment: body.comment ?? approval.comment,
            attachments: body.attachments ?? approval.attachments,
            changesRequestedDueDate: body.changesRequestedDueDate
                ? new Date(body.changesRequestedDueDate)
                : approval.changesRequestedDueDate,
            signedOn: ['APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED'].includes(body.status)
                ? timestamp
                : approval.signedOn,
            remarks: body.comment ?? approval.remarks,
            signature,
            approverId: userId
        };
        const nextReworkCount = body.status === 'CHANGES_REQUESTED'
            ? approval.reworkCount + 1
            : approval.reworkCount;
        updateData.reworkCount = nextReworkCount;
        if (body.status !== 'PENDING' && body.status !== 'IN_REVIEW') {
            updateData.decidedAt = timestamp;
        }
        const updated = await this.prisma.approval.update({
            where: { id },
            data: updateData
        });
        if (approval.stage === 'GO_NO_GO' && ['APPROVED', 'REJECTED'].includes(body.status)) {
            const pack = await this.prisma.pricingPack.findUnique({ where: { id: approval.packId } });
            if (pack) {
                await this.prisma.opportunity.update({
                    where: { id: pack.opportunityId },
                    data: {
                        goNoGoStatus: body.status,
                        goNoGoUpdatedAt: timestamp
                    }
                });
            }
        }
        try {
            const opportunity = approval.pack?.opportunity;
            const tenantId = opportunity?.tenantId || 'default';
            const stageLabel = stageLabelMap[approval.stage || approval.type || ''] ?? getStageLabel(approval.stage, approval.type);
            const subject = `${stageLabel} ${body.status}`;
            const actionUrl = opportunity
                ? (0, frontend_url_1.buildFrontendUrl)(`/opportunity/${opportunity.id}/approvals`)
                : (0, frontend_url_1.buildFrontendUrl)('/approvals/review');
            const statusLabel = statusLabelMap[body.status] ?? body.status;
            const statusClass = statusClassMap[body.status] ?? 'status-flagged';
            const approver = userId
                ? await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
                : null;
            const templateData = {
                STATUS_LABEL: statusLabel,
                STATUS_CLASS: statusClass,
                HERO_HEADLINE: `${stageLabel} ${statusLabel}`,
                HERO_SUBTEXT: `Decision recorded for ${opportunity?.title || 'Opportunity'}.`,
                STAGE_LABEL: stageLabel,
                OPPORTUNITY_TITLE: opportunity?.title || 'Opportunity',
                APPROVER_NAME: approver?.name || 'Approver',
                DECISION_COMMENT: body.comment ?? approval.comment ?? 'No additional comments',
                DECISION_DATE: new Date().toISOString().split('T')[0],
                CTA_URL: actionUrl,
                CTA_TEXT: `View ${stageLabel.toLowerCase()}`
            };
            await this.notifications.dispatch({
                activity: notifications_constants_1.NotificationActivities.APPROVAL_DECISION,
                stage: approval.stage ?? undefined,
                tenantId,
                subject,
                body: `${subject} — ${opportunity?.title || 'Opportunity'}`,
                opportunityId: opportunity?.id,
                actorId: userId,
                includeDefaults: true,
                payload: {
                    status: body.status,
                    stage: approval.stage,
                    approvalId: approval.id,
                    actionUrl,
                    actionLabel: `View ${stageLabel.toLowerCase()} approval`,
                    templateName: 'approval-decision',
                    templateData
                }
            });
        }
        catch (err) {
            console.warn('[notifications] Failed to dispatch approval decision', err);
        }
        return updated;
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map