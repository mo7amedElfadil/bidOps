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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const sync_1 = require("csv-parse/sync");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
let ImportController = class ImportController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    template() {
        const headers = [
            'Sno',
            'Customer',
            'Tender Details',
            'Description',
            'Target Submission date',
            'Submission Date',
            'Notes',
            'Status',
            'Business Owner',
            'Bid Owner',
            'Tender Bond Readiness',
            'Tender Value',
            'Mode of Submission',
            'Days Left',
            'Reformatted Date',
            'Rank',
            'Validity',
            'N/A'
        ];
        return headers.join(',') + '\\n';
    }
    async importTracker(file, req) {
        if (!file)
            throw new common_1.BadRequestException('file is required');
        const tenantId = req?.user?.tenantId || 'default';
        const importDateFormat = await this.getImportDateFormat();
        const text = file.buffer.toString('utf-8');
        const records = (0, sync_1.parse)(text, { columns: true, skip_empty_lines: true, trim: true });
        let clientsCreated = 0;
        let oppsUpserted = 0;
        const users = await this.prisma.user.findMany({
            where: { tenantId },
            select: { id: true, name: true, email: true }
        });
        const usersByEmail = new Map(users.map(user => [user.email.toLowerCase(), user.id]));
        const usersByName = new Map(users.map(user => [user.name.toLowerCase(), user.id]));
        const issues = [];
        for (const [index, row] of records.entries()) {
            const clientName = getField(row, ['Customer', 'Client'])?.trim();
            if (!clientName)
                continue;
            const client = await this.prisma.client.upsert({
                where: { name_tenantId: { name: clientName, tenantId } },
                update: {},
                create: { name: clientName, sector: undefined, tenantId }
            });
            if (client)
                clientsCreated += 0;
            const submissionField = getFieldInfo(row, ['Submission Date', 'Target Submission date', 'Reformatted Date']);
            const submissionDate = parseDate(submissionField?.value, importDateFormat);
            if (submissionField?.value && !submissionDate) {
                issues.push({
                    opportunityId: 'pending',
                    fieldName: 'submissionDate',
                    columnName: submissionField.columnName,
                    rowIndex: index + 2,
                    rawValue: submissionField.value,
                    message: 'Invalid date; value left empty'
                });
            }
            const daysField = getFieldInfo(row, ['Days Left', 'Days left']);
            const daysLeft = toNumber(daysField?.value);
            if (daysField?.value && daysLeft === undefined) {
                issues.push({
                    opportunityId: 'pending',
                    fieldName: 'daysLeft',
                    columnName: daysField.columnName,
                    rowIndex: index + 2,
                    rawValue: daysField.value,
                    message: 'Invalid number; value left empty'
                });
            }
            const rankField = getFieldInfo(row, ['Rank']);
            const priorityRank = toNumber(rankField?.value);
            if (rankField?.value && priorityRank === undefined) {
                issues.push({
                    opportunityId: 'pending',
                    fieldName: 'priorityRank',
                    columnName: rankField.columnName,
                    rowIndex: index + 2,
                    rawValue: rankField.value,
                    message: 'Invalid number; value left empty'
                });
            }
            const validityField = getFieldInfo(row, ['Validity']);
            const validityDays = toNumber(validityField?.value);
            if (validityField?.value && validityDays === undefined) {
                issues.push({
                    opportunityId: 'pending',
                    fieldName: 'validityDays',
                    columnName: validityField.columnName,
                    rowIndex: index + 2,
                    rawValue: validityField.value,
                    message: 'Invalid number; value left empty'
                });
            }
            const bidOwnerField = getFieldInfo(row, ['Bid Owner', 'Bid Owners']);
            const bidOwnerNames = bidOwnerField?.value ? splitOwners(bidOwnerField.value) : [];
            const bidOwnerIds = [];
            for (const ownerName of bidOwnerNames) {
                const resolved = await resolveUser(ownerName, tenantId, usersByEmail, usersByName, this.prisma);
                if (!resolved.isExisting) {
                    issues.push({
                        opportunityId: 'pending',
                        fieldName: 'bidOwners',
                        columnName: bidOwnerField?.columnName,
                        rowIndex: index + 2,
                        rawValue: ownerName,
                        message: 'Bid owner not found; temp user created'
                    });
                }
                bidOwnerIds.push(resolved.userId);
            }
            const businessOwnerField = getFieldInfo(row, ['Business Owner']);
            const businessOwnerName = businessOwnerField?.value;
            let ownerId;
            if (businessOwnerName) {
                const resolved = await resolveUser(businessOwnerName, tenantId, usersByEmail, usersByName, this.prisma);
                ownerId = resolved.userId;
                if (!resolved.isExisting) {
                    issues.push({
                        opportunityId: 'pending',
                        fieldName: 'ownerId',
                        columnName: businessOwnerField?.columnName,
                        rowIndex: index + 2,
                        rawValue: businessOwnerName,
                        message: 'Business owner not found; temp user created'
                    });
                }
            }
            const created = await this.prisma.opportunity.create({
                data: {
                    clientId: client.id,
                    tenderRef: getField(row, ['Tender Details']) || null,
                    title: getField(row, ['Description']) ||
                        getField(row, ['Tender Details']) ||
                        'Untitled',
                    description: getField(row, ['Description']) || null,
                    submissionDate: submissionDate ?? undefined,
                    status: getField(row, ['Status']) || undefined,
                    modeOfSubmission: getField(row, ['Mode of Submission']) || undefined,
                    daysLeft,
                    priorityRank,
                    validityDays,
                    dataOwner: businessOwnerName || undefined,
                    ownerId: ownerId ?? undefined,
                    tenantId
                }
            });
            if (bidOwnerIds.length) {
                await this.prisma.opportunityBidOwner.createMany({
                    data: bidOwnerIds.map(userId => ({
                        opportunityId: created.id,
                        userId
                    })),
                    skipDuplicates: true
                });
            }
            for (const issue of issues) {
                if (issue.opportunityId === 'pending' && issue.rowIndex === index + 2) {
                    issue.opportunityId = created.id;
                }
            }
            oppsUpserted += 1;
        }
        const readyIssues = issues.filter(issue => issue.opportunityId !== 'pending');
        if (readyIssues.length) {
            await this.prisma.importIssue.createMany({
                data: readyIssues.map(({ opportunityId, ...rest }) => ({ opportunityId, ...rest }))
            });
        }
        return { clientsCreated, oppsUpserted, issues: readyIssues };
    }
    listIssues(req, opportunityId, resolved) {
        const tenantId = req?.user?.tenantId || 'default';
        const resolvedAt = resolved === 'true' ? { not: null } : resolved === 'false' ? null : undefined;
        return this.prisma.importIssue.findMany({
            where: {
                opportunity: { tenantId },
                ...(opportunityId ? { opportunityId } : {}),
                ...(resolvedAt === undefined ? {} : { resolvedAt })
            },
            orderBy: [{ createdAt: 'desc' }]
        });
    }
    resolveIssue(id) {
        return this.prisma.importIssue.update({
            where: { id },
            data: { resolvedAt: new Date() }
        });
    }
    async getImportDateFormat() {
        const row = await this.prisma.appSetting.findUnique({ where: { key: 'import.dateFormat' } });
        const value = (row?.value || 'MDY').toUpperCase();
        return value === 'DMY' ? 'DMY' : value === 'AUTO' ? 'AUTO' : 'MDY';
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Get)('templates/tracker.csv'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "template", null);
__decorate([
    (0, common_1.Post)('tracker'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importTracker", null);
__decorate([
    (0, common_1.Get)('issues'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('opportunityId')),
    __param(2, (0, common_1.Query)('resolved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "listIssues", null);
__decorate([
    (0, common_1.Patch)('issues/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "resolveIssue", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('import'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportController);
function normalizeHeader(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function getField(row, keys) {
    const keyMap = new Map(Object.keys(row).map(k => [normalizeHeader(k), k]));
    for (const key of keys) {
        const actual = keyMap.get(normalizeHeader(key));
        const value = actual ? row[actual] : undefined;
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }
    return undefined;
}
function getFieldInfo(row, keys) {
    const keyMap = new Map(Object.keys(row).map(k => [normalizeHeader(k), k]));
    for (const key of keys) {
        const actual = keyMap.get(normalizeHeader(key));
        const value = actual ? row[actual] : undefined;
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return { value: String(value).trim(), columnName: actual };
        }
    }
    return undefined;
}
function toNumber(value) {
    if (!value)
        return undefined;
    const num = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(num) ? num : undefined;
}
function parseDate(value, format = 'MDY') {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (match) {
        const first = Number(match[1]);
        const second = Number(match[2]);
        const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
        const hour = match[4] ? Number(match[4]) : 0;
        const minute = match[5] ? Number(match[5]) : 0;
        let day = first;
        let month = second;
        if (format === 'MDY') {
            month = first;
            day = second;
        }
        else if (format === 'DMY') {
            day = first;
            month = second;
        }
        else {
            if (second > 12 && first <= 12) {
                day = second;
                month = first;
            }
            if (first > 12 && second <= 12) {
                day = first;
                month = second;
            }
        }
        if (month < 1 || month > 12 || day < 1 || day > 31)
            return undefined;
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
function splitOwners(value) {
    return value
        .split(/[,;/\n]+/g)
        .map(part => part.trim())
        .filter(isLikelyPerson);
}
function isLikelyPerson(value) {
    const normalized = value.toLowerCase().trim();
    if (!normalized)
        return false;
    if (normalized.includes('not required') || normalized.includes('not requested'))
        return false;
    if (normalized.includes('temporary') || normalized.includes('sent our ifp'))
        return false;
    const digitsOnly = normalized.replace(/[\s\-\/,:]+/g, '');
    if (/^\d+$/.test(digitsOnly))
        return false;
    if (/^\d+(st|nd|rd|th)$/i.test(normalized))
        return false;
    if (/^(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/.test(normalized))
        return false;
    const hasAlpha = /[a-zA-Z]/.test(normalized);
    return hasAlpha;
}
function normalizeUserKey(value) {
    return value.toLowerCase().trim();
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'user';
}
async function resolveUser(value, tenantId, usersByEmail, usersByName, prisma) {
    const lookup = normalizeUserKey(value);
    const existingId = usersByEmail.get(lookup) || usersByName.get(lookup);
    if (existingId) {
        return { userId: existingId, isExisting: true };
    }
    const slug = slugify(value);
    const email = value.includes('@')
        ? value
        : `temp+${slug}+${Date.now()}@bidops.local`;
    const created = await prisma.user.create({
        data: {
            email,
            name: value.trim(),
            role: 'VIEWER',
            isActive: false,
            userType: 'TEMP',
            tenantId
        }
    });
    usersByEmail.set(created.email.toLowerCase(), created.id);
    usersByName.set(created.name.toLowerCase(), created.id);
    return { userId: created.id, isExisting: false };
}
//# sourceMappingURL=import.controller.js.map