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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportAwardsCsv() {
        const rows = await this.prisma.awardEvent.findMany({ orderBy: { awardDate: 'desc' } });
        const headers = ['Portal', 'TenderRef', 'Client', 'Title', 'AwardDate', 'Winners', 'AwardValue', 'Codes'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            lines.push([
                esc(r.portal),
                esc(r.tenderRef || ''),
                esc(r.client || ''),
                esc(r.title || ''),
                esc(r.awardDate ? r.awardDate.toISOString().slice(0, 10) : ''),
                esc(r.winners.join(';')),
                esc(r.awardValue?.toString() || ''),
                esc(r.codes.join(';'))
            ].join(','));
        }
        return lines.join('\\n');
    }
    async generateReportContext() {
        return {
            summary: 'Executive summary of the current pipeline performance based on recent awards and opportunities.',
            trends: ['Win rate increased by 5% in Q4', 'Healthcare sector showing strong growth'],
            recommendations: ['Focus on Hamad Medical Corporation tenders', 'Review lost bids for pricing patterns']
        };
    }
    async exportOpportunitiesCsv(tenantId) {
        const rows = await this.prisma.opportunity.findMany({
            where: { tenantId },
            include: { client: true },
            orderBy: [{ submissionDate: 'asc' }]
        });
        const headers = ['OpportunityId', 'Client', 'TenderRef', 'Title', 'Stage', 'Status', 'SubmissionDate', 'DaysLeft', 'Rank', 'CreatedAt'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            lines.push([
                esc(r.id),
                esc(r.client?.name || ''),
                esc(r.tenderRef || ''),
                esc(r.title),
                esc(r.stage || ''),
                esc(r.status || ''),
                esc(r.submissionDate ? r.submissionDate.toISOString().slice(0, 10) : ''),
                esc(r.daysLeft?.toString() || ''),
                esc(r.priorityRank?.toString() || ''),
                esc(r.createdAt.toISOString())
            ].join(','));
        }
        return lines.join('\\n');
    }
    async getOnboardingMetrics(tenantId) {
        const [firstAdmin, firstNonAdmin, firstRole, firstDefault] = await Promise.all([
            this.prisma.user.findFirst({
                where: { tenantId, role: 'ADMIN' },
                orderBy: { createdAt: 'asc' }
            }),
            this.prisma.user.findFirst({
                where: { tenantId, role: { not: 'ADMIN' } },
                orderBy: { createdAt: 'asc' }
            }),
            this.prisma.businessRole.findFirst({
                where: { tenantId },
                orderBy: { createdAt: 'asc' }
            }),
            this.prisma.notificationRoutingDefault.findFirst({
                where: { tenantId },
                orderBy: { createdAt: 'asc' }
            })
        ]);
        const startedAt = firstAdmin?.createdAt ?? null;
        const usersCompletedAt = firstNonAdmin?.createdAt ?? null;
        const rolesCompletedAt = firstRole?.createdAt ?? null;
        const defaultsCompletedAt = firstDefault?.createdAt ?? null;
        const durationHours = (start, end) => {
            if (!start || !end)
                return null;
            return Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;
        };
        const approvals = await this.prisma.approval.findMany({
            where: {
                decidedAt: { not: null, gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                pack: { opportunity: { tenantId } }
            },
            select: { decidedAt: true, requestedAt: true, createdAt: true, lateDecision: true }
        });
        const durations = approvals
            .map(row => {
            const start = row.requestedAt || row.createdAt;
            if (!row.decidedAt || !start)
                return null;
            return (row.decidedAt.getTime() - start.getTime()) / (1000 * 60 * 60);
        })
            .filter((value) => value !== null && Number.isFinite(value));
        const average = durations.length
            ? durations.reduce((sum, value) => sum + value, 0) / durations.length
            : null;
        const median = durations.length
            ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
            : null;
        const lateCount = approvals.filter(row => row.lateDecision).length;
        const completionDates = [usersCompletedAt, rolesCompletedAt, defaultsCompletedAt].filter(Boolean);
        const overallCompletion = completionDates.length
            ? completionDates.sort((a, b) => a.getTime() - b.getTime())[completionDates.length - 1]
            : null;
        return {
            startedAt,
            usersCompletedAt,
            rolesCompletedAt,
            defaultsCompletedAt,
            durationsHours: {
                users: durationHours(startedAt, usersCompletedAt),
                roles: durationHours(startedAt, rolesCompletedAt),
                defaults: durationHours(startedAt, defaultsCompletedAt),
                overall: durationHours(startedAt, overallCompletion)
            },
            approvalsTurnaround: {
                count: durations.length,
                averageHours: average ? Math.round(average * 10) / 10 : null,
                medianHours: median ? Math.round(median * 10) / 10 : null,
                lateCount
            }
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
function esc(s) {
    if (s.includes(',') || s.includes('"') || s.includes('\\n'))
        return '"' + s.replace(/"/g, '""') + '"';
    return s;
}
//# sourceMappingURL=analytics.service.js.map