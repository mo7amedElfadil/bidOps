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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const DEFAULTS = { warn: 7, alert: 3, urgent: 1 };
const HOLIDAY_KEY = 'sla.holidays';
const RETENTION_KEY = 'retention.years';
const TIMEZONE_KEY = 'time.offsetHours';
const IMPORT_DATE_KEY = 'import.dateFormat';
const STAGE_KEY = 'opportunity.stages';
const STATUS_KEY = 'opportunity.statuses';
const SOCIAL_KEYS = ['social.linkedin', 'social.x', 'social.instagram', 'social.youtube'];
const DEFAULT_STAGES = [
    'Sourcing',
    'Qualification',
    'Purchase',
    'Elaboration',
    'Pricing & Approvals',
    'Submission',
    'Evaluation',
    'Outcome',
    'Closeout'
];
const DEFAULT_STATUSES = ['Open', 'Submitted', 'Won', 'Lost', 'Withdrawn', 'Cancelled'];
let SettingsController = class SettingsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSla() {
        const keys = ['sla.warnDays', 'sla.alertDays', 'sla.urgentDays'];
        const rows = await this.prisma.appSetting.findMany({ where: { key: { in: keys } } });
        const map = new Map(rows.map(r => [r.key, r.value]));
        return {
            warnDays: Number(map.get('sla.warnDays') ?? process.env.SLA_WARN_DAYS ?? DEFAULTS.warn),
            alertDays: Number(map.get('sla.alertDays') ?? process.env.SLA_ALERT_DAYS ?? DEFAULTS.alert),
            urgentDays: Number(map.get('sla.urgentDays') ?? process.env.SLA_URGENT_DAYS ?? DEFAULTS.urgent)
        };
    }
    async setSla(body) {
        const payload = {
            warnDays: body.warnDays ?? DEFAULTS.warn,
            alertDays: body.alertDays ?? DEFAULTS.alert,
            urgentDays: body.urgentDays ?? DEFAULTS.urgent
        };
        await this.prisma.$transaction([
            this.prisma.appSetting.upsert({
                where: { key: 'sla.warnDays' },
                update: { value: String(payload.warnDays) },
                create: { key: 'sla.warnDays', value: String(payload.warnDays) }
            }),
            this.prisma.appSetting.upsert({
                where: { key: 'sla.alertDays' },
                update: { value: String(payload.alertDays) },
                create: { key: 'sla.alertDays', value: String(payload.alertDays) }
            }),
            this.prisma.appSetting.upsert({
                where: { key: 'sla.urgentDays' },
                update: { value: String(payload.urgentDays) },
                create: { key: 'sla.urgentDays', value: String(payload.urgentDays) }
            })
        ]);
        return payload;
    }
    async getHolidays() {
        const row = await this.prisma.appSetting.findUnique({ where: { key: HOLIDAY_KEY } });
        if (!row?.value)
            return { dates: [] };
        try {
            const parsed = JSON.parse(row.value);
            return { dates: Array.isArray(parsed) ? parsed : [] };
        }
        catch {
            return { dates: [] };
        }
    }
    async setHolidays(body) {
        const dates = Array.isArray(body.dates) ? body.dates : [];
        await this.prisma.appSetting.upsert({
            where: { key: HOLIDAY_KEY },
            update: { value: JSON.stringify(dates) },
            create: { key: HOLIDAY_KEY, value: JSON.stringify(dates) }
        });
        return { dates };
    }
    async getRetention() {
        const row = await this.prisma.appSetting.findUnique({ where: { key: RETENTION_KEY } });
        return { years: Number(row?.value ?? 5) };
    }
    async setRetention(body) {
        const years = Number(body.years ?? 5);
        await this.prisma.appSetting.upsert({
            where: { key: RETENTION_KEY },
            update: { value: String(years) },
            create: { key: RETENTION_KEY, value: String(years) }
        });
        return { years };
    }
    async getTimezone() {
        const row = await this.prisma.appSetting.findUnique({ where: { key: TIMEZONE_KEY } });
        return { offsetHours: Number(row?.value ?? 3) };
    }
    async setTimezone(body) {
        const offsetHours = Number(body.offsetHours ?? 3);
        await this.prisma.appSetting.upsert({
            where: { key: TIMEZONE_KEY },
            update: { value: String(offsetHours) },
            create: { key: TIMEZONE_KEY, value: String(offsetHours) }
        });
        return { offsetHours };
    }
    async getOpportunityStages() {
        const stages = await this.getList(STAGE_KEY, DEFAULT_STAGES);
        return { stages };
    }
    async setOpportunityStages(body) {
        const stages = this.cleanList(body.stages ?? [], DEFAULT_STAGES);
        await this.prisma.appSetting.upsert({
            where: { key: STAGE_KEY },
            update: { value: JSON.stringify(stages) },
            create: { key: STAGE_KEY, value: JSON.stringify(stages) }
        });
        return { stages };
    }
    async getOpportunityStatuses() {
        const statuses = await this.getList(STATUS_KEY, DEFAULT_STATUSES);
        return { statuses };
    }
    async setOpportunityStatuses(body) {
        const statuses = this.cleanList(body.statuses ?? [], DEFAULT_STATUSES);
        await this.prisma.appSetting.upsert({
            where: { key: STATUS_KEY },
            update: { value: JSON.stringify(statuses) },
            create: { key: STATUS_KEY, value: JSON.stringify(statuses) }
        });
        return { statuses };
    }
    async getList(key, fallback) {
        const row = await this.prisma.appSetting.findUnique({ where: { key } });
        if (!row?.value)
            return fallback;
        try {
            const parsed = JSON.parse(row.value);
            return Array.isArray(parsed) ? parsed : fallback;
        }
        catch {
            return fallback;
        }
    }
    cleanList(values, fallback) {
        const cleaned = Array.from(new Set(values.map(v => (v || '').trim()).filter(Boolean)));
        return cleaned.length ? cleaned : fallback;
    }
    async getImportDateFormat() {
        const row = await this.prisma.appSetting.findUnique({ where: { key: IMPORT_DATE_KEY } });
        const value = (row?.value || 'MDY').toUpperCase();
        return { format: value === 'DMY' ? 'DMY' : value === 'AUTO' ? 'AUTO' : 'MDY' };
    }
    async setImportDateFormat(body) {
        const raw = (body.format || 'MDY').toUpperCase();
        const format = raw === 'DMY' ? 'DMY' : raw === 'AUTO' ? 'AUTO' : 'MDY';
        await this.prisma.appSetting.upsert({
            where: { key: IMPORT_DATE_KEY },
            update: { value: format },
            create: { key: IMPORT_DATE_KEY, value: format }
        });
        return { format };
    }
    async getSocials() {
        const rows = await this.prisma.appSetting.findMany({
            where: { key: { in: SOCIAL_KEYS } }
        });
        const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
        return {
            linkedin: map['social.linkedin'] ?? '',
            x: map['social.x'] ?? '',
            instagram: map['social.instagram'] ?? '',
            youtube: map['social.youtube'] ?? ''
        };
    }
    async setSocials(body) {
        const entries = [
            { key: 'social.linkedin', value: (body.linkedin || '').trim() },
            { key: 'social.x', value: (body.x || '').trim() },
            { key: 'social.instagram', value: (body.instagram || '').trim() },
            { key: 'social.youtube', value: (body.youtube || '').trim() }
        ];
        await this.prisma.$transaction(entries.map(entry => this.prisma.appSetting.upsert({
            where: { key: entry.key },
            update: { value: entry.value },
            create: { key: entry.key, value: entry.value }
        })));
        return {
            linkedin: entries[0].value,
            x: entries[1].value,
            instagram: entries[2].value,
            youtube: entries[3].value
        };
    }
    async listFxRates(req) {
        const tenantId = req.user?.tenantId || 'default';
        return this.prisma.fxRate.findMany({ where: { tenantId }, orderBy: [{ currency: 'asc' }] });
    }
    async upsertFxRate(body, req) {
        const tenantId = req.user?.tenantId || 'default';
        const currency = body.currency?.toUpperCase();
        if (!currency)
            throw new common_1.BadRequestException('currency is required');
        const rateToQar = Number(body.rateToQar);
        return this.prisma.fxRate.upsert({
            where: { currency_tenantId: { currency, tenantId } },
            update: { rateToQar },
            create: { currency, rateToQar, tenantId }
        });
    }
    async updateFxRate(id, body) {
        const rateToQar = Number(body.rateToQar);
        return this.prisma.fxRate.update({
            where: { id },
            data: { rateToQar }
        });
    }
    async deleteFxRate(id) {
        return this.prisma.fxRate.delete({ where: { id } });
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('sla'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSla", null);
__decorate([
    (0, common_1.Put)('sla'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setSla", null);
__decorate([
    (0, common_1.Get)('holidays'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getHolidays", null);
__decorate([
    (0, common_1.Put)('holidays'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setHolidays", null);
__decorate([
    (0, common_1.Get)('retention'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getRetention", null);
__decorate([
    (0, common_1.Put)('retention'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setRetention", null);
__decorate([
    (0, common_1.Get)('timezone'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getTimezone", null);
__decorate([
    (0, common_1.Put)('timezone'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setTimezone", null);
__decorate([
    (0, common_1.Get)('opportunity/stages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getOpportunityStages", null);
__decorate([
    (0, common_1.Put)('opportunity/stages'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setOpportunityStages", null);
__decorate([
    (0, common_1.Get)('opportunity/statuses'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getOpportunityStatuses", null);
__decorate([
    (0, common_1.Put)('opportunity/statuses'),
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setOpportunityStatuses", null);
__decorate([
    (0, common_1.Get)('import-date-format'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getImportDateFormat", null);
__decorate([
    (0, common_1.Put)('import-date-format'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setImportDateFormat", null);
__decorate([
    (0, common_1.Get)('socials'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSocials", null);
__decorate([
    (0, common_1.Put)('socials'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "setSocials", null);
__decorate([
    (0, common_1.Get)('fx-rates'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "listFxRates", null);
__decorate([
    (0, common_1.Post)('fx-rates'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "upsertFxRate", null);
__decorate([
    (0, common_1.Patch)('fx-rates/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateFxRate", null);
__decorate([
    (0, common_1.Delete)('fx-rates/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "deleteFxRate", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map