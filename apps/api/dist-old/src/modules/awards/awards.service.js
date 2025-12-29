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
exports.AwardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const collector_queue_1 = require("../../queues/collector.queue");
const pagination_1 = require("../../utils/pagination");
const date_1 = require("../../utils/date");
let AwardsService = class AwardsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listStaging(filters = {}) {
        const where = {};
        if (filters.status && filters.status !== 'all') {
            where.status = filters.status;
        }
        if (filters.fromDate || filters.toDate) {
            const from = (0, date_1.parseDateInput)(filters.fromDate);
            const to = (0, date_1.parseDateInput)(filters.toDate, true);
            where.awardDate = {};
            if (from)
                where.awardDate.gte = from;
            if (to)
                where.awardDate.lte = to;
        }
        if (filters.q?.trim()) {
            const term = filters.q.trim();
            const like = { contains: term, mode: 'insensitive' };
            where.OR = [
                { portal: like },
                { tenderRef: like },
                { client: like },
                { title: like },
                { status: like },
                { sourceUrl: like },
                { notes: like }
            ];
        }
        const { page, pageSize, skip } = (0, pagination_1.parsePagination)(filters, 25, 200);
        return this.prisma.$transaction([
            this.prisma.awardStaging.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.awardStaging.count({ where })
        ]).then(([items, total]) => ({ items, total, page, pageSize }));
    }
    createStaging(data) {
        return this.prisma.awardStaging.create({
            data: {
                portal: data.portal,
                tenderRef: data.tenderRef,
                client: data.client ?? data.buyer,
                title: data.title,
                titleOriginal: data.titleOriginal,
                closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
                awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
                winners: Array.isArray(data.winners) ? data.winners : (data.winners ? String(data.winners).split(',').map((w) => w.trim()).filter(Boolean) : []),
                awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
                codes: Array.isArray(data.codes) ? data.codes : (data.codes ? String(data.codes).split(',').map((c) => c.trim()).filter(Boolean) : []),
                notes: data.notes,
                rawPath: data.rawPath,
                sourceUrl: data.sourceUrl,
                status: data.status || 'new'
            }
        });
    }
    updateStaging(id, data) {
        return this.prisma.awardStaging.update({
            where: { id },
            data: {
                portal: data.portal,
                tenderRef: data.tenderRef,
                client: data.client ?? data.buyer,
                title: data.title,
                titleOriginal: data.titleOriginal,
                closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
                awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
                winners: Array.isArray(data.winners)
                    ? data.winners
                    : data.winners
                        ? String(data.winners).split(',').map((w) => w.trim()).filter(Boolean)
                        : undefined,
                awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
                codes: Array.isArray(data.codes)
                    ? data.codes
                    : data.codes
                        ? String(data.codes).split(',').map((c) => c.trim()).filter(Boolean)
                        : undefined,
                notes: data.notes,
                rawPath: data.rawPath,
                sourceUrl: data.sourceUrl,
                status: data.status
            }
        });
    }
    deleteStaging(id) {
        return this.prisma.awardStaging.delete({ where: { id } });
    }
    async curate(id) {
        const row = await this.prisma.awardStaging.findUnique({ where: { id } });
        if (!row)
            return null;
        const event = await this.prisma.awardEvent.create({
            data: {
                portal: row.portal,
                tenderRef: row.tenderRef || undefined,
                client: row.client || undefined,
                title: row.title || undefined,
                titleOriginal: row.titleOriginal || undefined,
                awardDate: row.awardDate || undefined,
                winners: row.winners,
                awardValue: row.awardValue || undefined,
                codes: row.codes,
                sourceUrl: row.sourceUrl || undefined
            }
        });
        await this.prisma.awardStaging.update({ where: { id }, data: { status: 'curated' } });
        return event;
    }
    listEvents(query = {}) {
        const where = {};
        if (query.q?.trim()) {
            const term = query.q.trim();
            const like = { contains: term, mode: 'insensitive' };
            where.OR = [
                { portal: like },
                { tenderRef: like },
                { client: like },
                { title: like },
                { sourceUrl: like }
            ];
        }
        const { page, pageSize, skip } = (0, pagination_1.parsePagination)(query, 25, 200);
        return this.prisma.$transaction([
            this.prisma.awardEvent.findMany({
                orderBy: { awardDate: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.awardEvent.count()
        ]).then(([items, total]) => ({ items, total, page, pageSize }));
    }
    updateEvent(id, data) {
        return this.prisma.awardEvent.update({
            where: { id },
            data: {
                portal: data.portal,
                tenderRef: data.tenderRef,
                client: data.client ?? data.buyer,
                title: data.title,
                titleOriginal: data.titleOriginal,
                awardDate: data.awardDate ? new Date(data.awardDate) : undefined,
                winners: Array.isArray(data.winners)
                    ? data.winners
                    : data.winners
                        ? String(data.winners).split(',').map((w) => w.trim()).filter(Boolean)
                        : undefined,
                awardValue: data.awardValue !== undefined ? Number(data.awardValue) : undefined,
                codes: Array.isArray(data.codes)
                    ? data.codes
                    : data.codes
                        ? String(data.codes).split(',').map((c) => c.trim()).filter(Boolean)
                        : undefined,
                sourceUrl: data.sourceUrl
            }
        });
    }
    deleteEvent(id) {
        return this.prisma.awardEvent.delete({ where: { id } });
    }
    async triggerCollector(payload) {
        const job = await (0, collector_queue_1.enqueueAwardCollector)({
            adapterId: payload.adapterId,
            fromDate: (0, date_1.normalizeDateInput)(payload.fromDate),
            toDate: (0, date_1.normalizeDateInput)(payload.toDate)
        });
        return { jobId: job.id, status: 'queued' };
    }
    async triggerTenderCollector(payload) {
        const job = await (0, collector_queue_1.enqueueTenderCollector)(payload);
        return { jobId: job.id, status: 'queued' };
    }
};
exports.AwardsService = AwardsService;
exports.AwardsService = AwardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AwardsService);
//# sourceMappingURL=awards.service.js.map