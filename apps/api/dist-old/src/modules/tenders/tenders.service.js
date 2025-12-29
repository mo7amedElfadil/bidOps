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
exports.TendersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tender_classifier_1 = require("@itsq-bidops/tender-classifier");
const prisma_service_1 = require("../../prisma/prisma.service");
const collector_queue_1 = require("../../queues/collector.queue");
const pagination_1 = require("../../utils/pagination");
const date_1 = require("../../utils/date");
const translate_1 = require("../../utils/translate");
const SMART_FILTER_THRESHOLD_KEY = 'tenders.smartFilter.threshold';
const SMART_FILTER_NEW_WINDOW_KEY = 'tenders.smartFilter.newWindowHours';
const SMART_FILTER_GROUP_SCOPES_KEY = 'tenders.smartFilter.groupScopes';
const SMART_FILTER_VERSION_KEY = 'tenders.smartFilter.version';
const DEFAULT_SMART_FILTER_THRESHOLD = 30;
const DEFAULT_SMART_FILTER_NEW_WINDOW_HOURS = 24;
const DEFAULT_GROUP_SCOPES = ['ITSQ', 'IOT_SHABAKA'];
let TendersService = class TendersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(filters, tenantId) {
        const where = { tenantId };
        const andFilters = [];
        const { page, pageSize, skip } = (0, pagination_1.parsePagination)(filters, 25, 200);
        const from = (0, date_1.parseDateInput)(filters.fromDate);
        const to = (0, date_1.parseDateInput)(filters.toDate, true);
        if (from || to) {
            const publishRange = {};
            const closeRange = {};
            if (from) {
                publishRange.gte = from;
                closeRange.gte = from;
            }
            if (to) {
                publishRange.lte = to;
                closeRange.lte = to;
            }
            andFilters.push({
                OR: [{ publishDate: publishRange }, { closeDate: closeRange }]
            });
        }
        if (filters.portal)
            where.portal = filters.portal;
        if (filters.status)
            where.status = filters.status;
        if (filters.q?.trim()) {
            const term = filters.q.trim();
            const like = { contains: term, mode: 'insensitive' };
            const orFilters = [
                { portal: like },
                { tenderRef: like },
                { title: like },
                { ministry: like },
                { status: like },
                { tenderType: like },
                { requestedSectorType: like },
                { purchaseUrl: like },
                { sourceUrl: like }
            ];
            const numericTerm = Number(term.replace(/[^\d.-]/g, ''));
            if (!Number.isNaN(numericTerm)) {
                orFilters.push({ tenderBondValue: numericTerm }, { documentsValue: numericTerm });
            }
            where.OR = orFilters;
        }
        const minScore = this.parseNumber(filters.minScore);
        const isNew = this.parseBoolean(filters.isNew);
        const promoted = this.parseBoolean(filters.promoted);
        const scopeTokens = (filters.scopes || filters.scope || '')
            .split(',')
            .map(entry => entry.trim().toUpperCase())
            .filter(Boolean);
        const classificationFilters = {};
        if (typeof minScore === 'number') {
            classificationFilters.score = { gte: minScore };
        }
        if (isNew === true) {
            const config = await this.loadSmartFilterConfig();
            const now = new Date();
            const windowStart = new Date(now.getTime() - config.newWindowHours * 60 * 60 * 1000);
            andFilters.push({
                createdAt: { gte: windowStart },
                OR: [{ closeDate: null }, { closeDate: { gte: now } }]
            });
        }
        if (scopeTokens.length) {
            const scopeSet = new Set();
            if (scopeTokens.includes('GROUP')) {
                const config = await this.loadSmartFilterConfig();
                for (const scope of config.groupScopes) {
                    scopeSet.add(scope);
                }
            }
            for (const raw of scopeTokens) {
                if (raw === 'GROUP')
                    continue;
                const scope = this.normalizeScope(raw);
                if (scope)
                    scopeSet.add(scope);
            }
            const scopes = Array.from(scopeSet);
            if (scopes.length) {
                classificationFilters.matchedScopes = { hasSome: scopes };
            }
        }
        if (Object.keys(classificationFilters).length) {
            andFilters.push({ classification: { is: classificationFilters } });
        }
        if (promoted === true) {
            const opps = await this.prisma.opportunity.findMany({
                where: { tenantId, sourceTenderId: { not: null } },
                select: { sourceTenderId: true }
            });
            const tenderIds = opps.map(item => item.sourceTenderId).filter(Boolean);
            const orFilters = [{ status: 'promoted' }];
            if (tenderIds.length) {
                orFilters.push({ id: { in: tenderIds } });
            }
            andFilters.push({ OR: orFilters });
        }
        if (filters.goNoGoStatus?.trim()) {
            const status = filters.goNoGoStatus.trim().toUpperCase();
            const opps = await this.prisma.opportunity.findMany({
                where: {
                    tenantId,
                    goNoGoStatus: status,
                    sourceTenderId: { not: null }
                },
                select: { sourceTenderId: true }
            });
            const tenderIds = opps.map(item => item.sourceTenderId).filter(Boolean);
            if (!tenderIds.length) {
                return { items: [], total: 0, page, pageSize };
            }
            andFilters.push({ id: { in: tenderIds } });
        }
        if (andFilters.length) {
            where.AND = andFilters;
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.ministryTender.findMany({
                where,
                include: { classification: true },
                orderBy: [{ closeDate: 'asc' }, { publishDate: 'desc' }],
                skip,
                take: pageSize
            }),
            this.prisma.ministryTender.count({ where })
        ]);
        if (!items.length) {
            return { items, total, page, pageSize };
        }
        const tenderIds = items.map(item => item.id);
        const opps = await this.prisma.opportunity.findMany({
            where: {
                tenantId,
                sourceTenderId: { in: tenderIds }
            },
            select: {
                id: true,
                sourceTenderId: true,
                goNoGoStatus: true,
                goNoGoUpdatedAt: true
            }
        });
        const map = new Map();
        for (const opp of opps) {
            if (opp.sourceTenderId) {
                map.set(opp.sourceTenderId, opp);
            }
        }
        const enriched = items.map(item => {
            const match = map.get(item.id);
            return {
                ...item,
                opportunityId: match?.id ?? null,
                goNoGoStatus: match?.goNoGoStatus ?? null,
                goNoGoUpdatedAt: match?.goNoGoUpdatedAt ?? null
            };
        });
        return { items: enriched, total, page, pageSize };
    }
    get(id) {
        return this.prisma.ministryTender.findUnique({ where: { id }, include: { classification: true } });
    }
    async create(data, tenantId) {
        const normalizedTitle = await this.normalizeTenderTitle(data);
        const tender = await this.prisma.ministryTender.create({
            data: {
                portal: data.portal,
                tenderRef: data.tenderRef,
                title: normalizedTitle.title,
                titleOriginal: normalizedTitle.titleOriginal,
                ministry: data.ministry,
                publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
                closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
                requestedSectorType: data.requestedSectorType,
                tenderBondValue: data.tenderBondValue !== undefined ? Number(data.tenderBondValue) : undefined,
                documentsValue: data.documentsValue !== undefined ? Number(data.documentsValue) : undefined,
                tenderType: data.tenderType,
                purchaseUrl: data.purchaseUrl,
                sourceUrl: data.sourceUrl,
                status: data.status || 'new',
                tenantId
            }
        });
        await this.upsertClassification(tender, tenantId);
        return tender;
    }
    async update(id, data) {
        const normalizedTitle = await this.normalizeTenderTitle(data);
        const tender = await this.prisma.ministryTender.update({
            where: { id },
            data: {
                portal: data.portal,
                tenderRef: data.tenderRef,
                title: normalizedTitle.title,
                titleOriginal: normalizedTitle.titleOriginal,
                ministry: data.ministry,
                publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
                closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
                requestedSectorType: data.requestedSectorType,
                tenderBondValue: data.tenderBondValue !== undefined ? Number(data.tenderBondValue) : undefined,
                documentsValue: data.documentsValue !== undefined ? Number(data.documentsValue) : undefined,
                tenderType: data.tenderType,
                purchaseUrl: data.purchaseUrl,
                sourceUrl: data.sourceUrl,
                status: data.status
            }
        });
        await this.upsertClassification(tender, tender.tenantId);
        return tender;
    }
    remove(id) {
        return this.prisma.ministryTender.delete({ where: { id } });
    }
    async promoteToOpportunity(id, tenantId) {
        const tender = await this.prisma.ministryTender.findUnique({ where: { id } });
        if (!tender)
            throw new common_1.BadRequestException('Tender not found');
        const clientName = tender.ministry?.trim();
        if (!clientName)
            throw new common_1.BadRequestException('Tender ministry is missing');
        const client = await this.prisma.client.upsert({
            where: { name_tenantId: { name: clientName, tenantId } },
            create: { name: clientName, tenantId },
            update: {}
        });
        let opportunity = await this.prisma.opportunity.findFirst({
            where: {
                tenantId,
                sourceTenderId: tender.id
            }
        });
        if (!opportunity && tender.tenderRef) {
            const match = await this.prisma.opportunity.findFirst({
                where: {
                    tenantId,
                    sourcePortal: tender.portal,
                    tenderRef: tender.tenderRef
                }
            });
            if (match) {
                opportunity = await this.prisma.opportunity.update({
                    where: { id: match.id },
                    data: { sourceTenderId: tender.id }
                });
            }
        }
        if (!opportunity) {
            opportunity = await this.prisma.opportunity.create({
                data: {
                    clientId: client.id,
                    title: tender.title || tender.tenderRef || 'New Opportunity',
                    tenderRef: tender.tenderRef || undefined,
                    sourcePortal: tender.portal,
                    sourceTenderId: tender.id,
                    discoveryDate: tender.publishDate || undefined,
                    tenantId
                }
            });
        }
        await this.prisma.ministryTender.update({
            where: { id },
            data: { status: 'promoted' }
        });
        return opportunity;
    }
    async triggerCollector(payload) {
        const job = await (0, collector_queue_1.enqueueTenderCollector)({
            adapterId: payload.adapterId,
            fromDate: (0, date_1.normalizeDateInput)(payload.fromDate),
            toDate: (0, date_1.normalizeDateInput)(payload.toDate)
        });
        return { jobId: job.id, status: 'queued' };
    }
    listActivities(tenantId) {
        return this.prisma.tenderActivity.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
    }
    async createActivity(data, tenantId) {
        const scope = this.normalizeScope(data.scope);
        if (!scope)
            throw new common_1.BadRequestException('Invalid scope');
        return this.prisma.tenderActivity.create({
            data: {
                name: data.name,
                description: data.description,
                scope,
                keywords: data.keywords || [],
                negativeKeywords: data.negativeKeywords || [],
                weight: data.weight ?? undefined,
                isHighPriority: data.isHighPriority ?? false,
                isActive: data.isActive ?? true,
                tenantId
            }
        });
    }
    async updateActivity(id, data, tenantId) {
        const update = {};
        if (data.name !== undefined)
            update.name = data.name;
        if (data.description !== undefined)
            update.description = data.description;
        if (data.scope !== undefined) {
            const scope = this.normalizeScope(data.scope);
            if (!scope)
                throw new common_1.BadRequestException('Invalid scope');
            update.scope = scope;
        }
        if (data.keywords !== undefined)
            update.keywords = data.keywords || [];
        if (data.negativeKeywords !== undefined)
            update.negativeKeywords = data.negativeKeywords || [];
        if (data.weight !== undefined)
            update.weight = data.weight;
        if (data.isHighPriority !== undefined)
            update.isHighPriority = data.isHighPriority;
        if (data.isActive !== undefined)
            update.isActive = data.isActive;
        const result = await this.prisma.tenderActivity.updateMany({
            where: { id, tenantId },
            data: update
        });
        if (!result.count) {
            throw new common_1.BadRequestException('Tender activity not found');
        }
        return this.prisma.tenderActivity.findUnique({ where: { id } });
    }
    async getClassification(tenderId, tenantId) {
        const classification = await this.prisma.tenderClassification.findFirst({
            where: { tenderId, tenantId }
        });
        if (!classification)
            return null;
        if (!classification.matchedActivityIds.length) {
            return { ...classification, matchedActivities: [] };
        }
        const activities = await this.prisma.tenderActivity.findMany({
            where: { id: { in: classification.matchedActivityIds }, tenantId }
        });
        const map = new Map(activities.map(activity => [activity.id, activity]));
        const matchedActivities = classification.matchedActivityIds
            .map(id => map.get(id))
            .filter(Boolean);
        return { ...classification, matchedActivities };
    }
    async reprocessClassifications(payload, tenantId, userId) {
        const from = (0, date_1.parseDateInput)(payload.fromDate);
        const to = (0, date_1.parseDateInput)(payload.toDate, true);
        const config = await this.loadSmartFilterConfig();
        const nextVersion = config.version + 1;
        await this.prisma.appSetting.upsert({
            where: { key: SMART_FILTER_VERSION_KEY },
            update: { value: String(nextVersion) },
            create: { key: SMART_FILTER_VERSION_KEY, value: String(nextVersion) }
        });
        const run = await this.prisma.tenderClassificationRun.create({
            data: {
                runType: client_1.TenderClassificationRunType.REPROCESS,
                classificationVersion: nextVersion,
                rangeFrom: from || undefined,
                rangeTo: to || undefined,
                triggeredBy: userId,
                tenantId
            }
        });
        const where = { tenantId };
        if (payload.portal)
            where.portal = payload.portal;
        if (from || to) {
            where.createdAt = {
                gte: from || undefined,
                lte: to || undefined
            };
        }
        const tenders = await this.prisma.ministryTender.findMany({ where });
        let processed = 0;
        let errors = 0;
        for (const tender of tenders) {
            try {
                await this.upsertClassification(tender, tenantId, nextVersion);
                processed += 1;
            }
            catch (err) {
                errors += 1;
            }
        }
        const stats = { processed, errors };
        await this.prisma.tenderClassificationRun.update({
            where: { id: run.id },
            data: { finishedAt: new Date(), stats }
        });
        return { runId: run.id, ...stats };
    }
    async translateExistingTitles(payload, tenantId, triggeredBy) {
        const where = { tenantId };
        const andFilters = [];
        const from = (0, date_1.parseDateInput)(payload.fromDate);
        const to = (0, date_1.parseDateInput)(payload.toDate, true);
        if (from || to) {
            const publishRange = {};
            const closeRange = {};
            if (from) {
                publishRange.gte = from;
                closeRange.gte = from;
            }
            if (to) {
                publishRange.lte = to;
                closeRange.lte = to;
            }
            andFilters.push({
                OR: [{ publishDate: publishRange }, { closeDate: closeRange }]
            });
        }
        if (payload.portal)
            where.portal = payload.portal;
        if (andFilters.length) {
            where.AND = andFilters;
        }
        const limit = Math.min(Math.max(this.parseNumber(payload.limit) ?? 200, 1), 1000);
        const dryRun = this.parseBoolean(payload.dryRun) ?? false;
        const tenders = await this.prisma.ministryTender.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        const summary = {
            scanned: 0,
            translated: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };
        for (const tender of tenders) {
            summary.scanned += 1;
            const title = tender.title?.trim() || '';
            const titleOriginal = tender.titleOriginal?.trim() || '';
            const source = (0, translate_1.containsArabic)(title) ? title : !title && (0, translate_1.containsArabic)(titleOriginal) ? titleOriginal : null;
            if (!source) {
                summary.skipped += 1;
                continue;
            }
            try {
                const translation = await (0, translate_1.translateArabicStrict)(source);
                if (!dryRun) {
                    const updated = await this.prisma.ministryTender.update({
                        where: { id: tender.id },
                        data: {
                            title: translation.translated,
                            titleOriginal: translation.original || source
                        }
                    });
                    await this.upsertClassification(updated, tenantId);
                }
                summary.translated += 1;
            }
            catch (err) {
                summary.failed += 1;
                if (summary.errors.length < 10) {
                    summary.errors.push({
                        tenderId: tender.id,
                        message: err?.message || 'Translation failed'
                    });
                }
            }
        }
        return {
            ...summary,
            limit,
            dryRun,
            portal: payload.portal || null,
            triggeredBy: triggeredBy || null
        };
    }
    parseBoolean(value) {
        if (value === undefined || value === null)
            return undefined;
        if (typeof value === 'boolean')
            return value;
        const raw = String(value).trim().toLowerCase();
        if (['1', 'true', 'yes', 'y'].includes(raw))
            return true;
        if (['0', 'false', 'no', 'n'].includes(raw))
            return false;
        return undefined;
    }
    parseNumber(value) {
        if (value === undefined || value === null)
            return undefined;
        const parsed = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    async normalizeTenderTitle(input) {
        const rawTitle = typeof input.title === 'string' ? input.title.trim() : input.title ?? undefined;
        const rawOriginal = typeof input.titleOriginal === 'string' ? input.titleOriginal.trim() : input.titleOriginal ?? undefined;
        if ((0, translate_1.containsArabic)(rawTitle)) {
            try {
                const translated = await (0, translate_1.translateArabicStrict)(rawTitle);
                return {
                    title: translated.translated,
                    titleOriginal: translated.original || rawTitle
                };
            }
            catch (err) {
                throw new common_1.BadRequestException(err?.message || 'Arabic title translation failed');
            }
        }
        if (!rawTitle && (0, translate_1.containsArabic)(rawOriginal)) {
            try {
                const translated = await (0, translate_1.translateArabicStrict)(rawOriginal);
                return {
                    title: translated.translated,
                    titleOriginal: translated.original || rawOriginal
                };
            }
            catch (err) {
                throw new common_1.BadRequestException(err?.message || 'Arabic title translation failed');
            }
        }
        return {
            title: rawTitle,
            titleOriginal: rawOriginal
        };
    }
    normalizeScope(value) {
        if (!value)
            return null;
        const raw = value.trim().toUpperCase();
        if (raw === 'ITSQ')
            return 'ITSQ';
        if (raw === 'IOT_SHABAKA' || raw === 'IOT')
            return 'IOT_SHABAKA';
        if (raw === 'OTHER')
            return 'OTHER';
        return null;
    }
    parseStringArray(value) {
        if (!value)
            return [];
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map(entry => String(entry)).filter(Boolean);
            }
        }
        catch {
        }
        return value
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean);
    }
    async loadSmartFilterConfig() {
        const rows = await this.prisma.appSetting.findMany({
            where: {
                key: {
                    in: [
                        SMART_FILTER_THRESHOLD_KEY,
                        SMART_FILTER_NEW_WINDOW_KEY,
                        SMART_FILTER_GROUP_SCOPES_KEY,
                        SMART_FILTER_VERSION_KEY
                    ]
                }
            }
        });
        const map = new Map(rows.map(row => [row.key, row.value]));
        const threshold = this.parseNumber(map.get(SMART_FILTER_THRESHOLD_KEY)) ?? DEFAULT_SMART_FILTER_THRESHOLD;
        const newWindowHours = this.parseNumber(map.get(SMART_FILTER_NEW_WINDOW_KEY)) ?? DEFAULT_SMART_FILTER_NEW_WINDOW_HOURS;
        const version = Math.max(1, Math.floor(this.parseNumber(map.get(SMART_FILTER_VERSION_KEY)) ?? 1));
        let groupScopes = DEFAULT_GROUP_SCOPES;
        const groupRaw = map.get(SMART_FILTER_GROUP_SCOPES_KEY);
        if (groupRaw) {
            const parsed = this.parseStringArray(groupRaw);
            const normalized = parsed
                .map(entry => this.normalizeScope(entry))
                .filter((scope) => Boolean(scope));
            if (normalized.length) {
                groupScopes = normalized;
            }
        }
        return { threshold, newWindowHours, groupScopes, version };
    }
    async upsertClassification(tender, tenantId, classificationVersion) {
        const activities = await this.prisma.tenderActivity.findMany({
            where: { tenantId, isActive: true }
        });
        const config = await this.loadSmartFilterConfig();
        const result = (0, tender_classifier_1.classifyTender)({
            title: tender.title,
            titleOriginal: tender.titleOriginal,
            ministry: tender.ministry,
            requestedSectorType: tender.requestedSectorType,
            tenderType: tender.tenderType,
            createdAt: tender.createdAt,
            closeDate: tender.closeDate
        }, activities.map(activity => ({
            id: activity.id,
            name: activity.name,
            scope: activity.scope,
            keywords: activity.keywords,
            negativeKeywords: activity.negativeKeywords,
            weight: activity.weight,
            isHighPriority: activity.isHighPriority,
            isActive: activity.isActive
        })), {
            newWindowHours: config.newWindowHours
        });
        const version = classificationVersion ?? config.version;
        return this.prisma.tenderClassification.upsert({
            where: { tenderId: tender.id },
            create: {
                tenderId: tender.id,
                classificationVersion: version,
                score: result.score,
                isNew: result.isNew,
                matchedActivityIds: result.matchedActivityIds,
                matchedScopes: result.matchedScopes,
                matchedKeywords: result.matchedKeywords,
                reasons: result.reasons,
                tenantId
            },
            update: {
                classificationVersion: version,
                score: result.score,
                isNew: result.isNew,
                matchedActivityIds: result.matchedActivityIds,
                matchedScopes: result.matchedScopes,
                matchedKeywords: result.matchedKeywords,
                reasons: result.reasons,
                tenantId
            }
        });
    }
};
exports.TendersService = TendersService;
exports.TendersService = TendersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TendersService);
//# sourceMappingURL=tenders.service.js.map