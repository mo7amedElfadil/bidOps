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
exports.ChangeRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notifications_constants_1 = require("../notifications/notifications.constants");
const frontend_url_1 = require("../../utils/frontend-url");
let ChangeRequestsService = class ChangeRequestsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    list(filters, tenantId) {
        const where = { opportunity: { tenantId } };
        if (filters.opportunityId)
            where.opportunityId = filters.opportunityId;
        if (filters.status)
            where.status = filters.status;
        return this.prisma.changeRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }
    async create(dto, userId, tenantId) {
        const opp = await this.prisma.opportunity.findUnique({
            where: { id: dto.opportunityId },
            include: { bidOwners: { select: { userId: true } } }
        });
        if (!opp || opp.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Opportunity not found');
        }
        const changeRequest = await this.prisma.changeRequest.create({
            data: {
                opportunityId: dto.opportunityId,
                changes: dto.changes,
                impact: dto.impact,
                requestedById: userId
            }
        });
        const recipients = new Set();
        if (opp.ownerId)
            recipients.add(opp.ownerId);
        for (const owner of opp.bidOwners || []) {
            if (owner.userId)
                recipients.add(owner.userId);
        }
        if (recipients.size) {
            try {
                await this.notifications.dispatch({
                    activity: notifications_constants_1.NotificationActivities.CHANGE_REQUEST_CREATED,
                    stage: 'CHANGE_REQUEST',
                    tenantId,
                    subject: `Change request filed for ${opp.title || 'Opportunity'}`,
                    body: `${opp.title || 'Opportunity'} has a new change request.`,
                    opportunityId: opp.id,
                    userIds: Array.from(recipients),
                    actorId: userId,
                    includeDefaults: false,
                    payload: {
                        actionUrl: (0, frontend_url_1.buildFrontendUrl)(`/opportunity/${opp.id}`),
                        actionLabel: 'Review change request'
                    }
                });
            }
            catch (err) {
                console.warn('[notifications] failed to dispatch change request alert', err);
            }
        }
        return changeRequest;
    }
    update(id, dto) {
        return this.prisma.changeRequest.update({
            where: { id },
            data: {
                status: dto.status,
                impact: dto.impact
            }
        });
    }
};
exports.ChangeRequestsService = ChangeRequestsService;
exports.ChangeRequestsService = ChangeRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notifications_service_1.NotificationsService])
], ChangeRequestsService);
//# sourceMappingURL=change-requests.service.js.map