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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PricingService = class PricingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listBoq(opportunityId) {
        return this.prisma.boQItem.findMany({ where: { opportunityId }, orderBy: [{ lineNo: 'asc' }] });
    }
    createBoq(opportunityId, data) {
        return this.prisma.boQItem.create({
            data: {
                opportunityId,
                lineNo: Number(data.lineNo || 1),
                category: data.category,
                description: data.description,
                qty: Number(data.qty || 1),
                unit: data.unit,
                oem: data.oem,
                sku: data.sku,
                unitCost: Number(data.unitCost || 0),
                unitCurrency: data.unitCurrency || 'QAR',
                markup: Number(data.markup || 0),
                unitPrice: Number(data.unitPrice || 0),
                customFields: data.customFields
            }
        });
    }
    updateBoq(id, data) {
        return this.prisma.boQItem.update({
            where: { id },
            data: {
                lineNo: data.lineNo !== undefined ? Number(data.lineNo) : undefined,
                category: data.category,
                description: data.description,
                qty: data.qty !== undefined ? Number(data.qty) : undefined,
                unit: data.unit,
                oem: data.oem,
                sku: data.sku,
                unitCost: data.unitCost !== undefined ? Number(data.unitCost) : undefined,
                unitCurrency: data.unitCurrency,
                markup: data.markup !== undefined ? Number(data.markup) : undefined,
                unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
                customFields: data.customFields
            }
        });
    }
    deleteBoq(id) {
        return this.prisma.boQItem.delete({ where: { id } });
    }
    listQuotes(opportunityId) {
        return this.prisma.vendorQuote.findMany({ where: { opportunityId }, orderBy: [{ createdAt: 'desc' }] });
    }
    listPackRows(opportunityId) {
        return this.prisma.pricingPackRow.findMany({ where: { opportunityId }, orderBy: [{ lineNo: 'asc' }] });
    }
    createPackRow(opportunityId, data) {
        return this.prisma.pricingPackRow.create({
            data: {
                opportunityId,
                lineNo: Number(data.lineNo || 1),
                description: data.description,
                qty: Number(data.qty || 1),
                unit: data.unit,
                unitCost: Number(data.unitCost || 0),
                unitCurrency: data.unitCurrency || 'QAR',
                customFields: data.customFields
            }
        });
    }
    updatePackRow(id, data) {
        return this.prisma.pricingPackRow.update({
            where: { id },
            data: {
                lineNo: data.lineNo !== undefined ? Number(data.lineNo) : undefined,
                description: data.description,
                qty: data.qty !== undefined ? Number(data.qty) : undefined,
                unit: data.unit,
                unitCost: data.unitCost !== undefined ? Number(data.unitCost) : undefined,
                unitCurrency: data.unitCurrency,
                customFields: data.customFields
            }
        });
    }
    deletePackRow(id) {
        return this.prisma.pricingPackRow.delete({ where: { id } });
    }
    listTemplates(tenantId, workspace, opportunityId) {
        return this.prisma.pricingTemplate.findMany({
            where: {
                tenantId,
                ...(workspace ? { workspace: workspace } : {}),
                ...(opportunityId ? { OR: [{ scope: 'GLOBAL' }, { opportunityId }] } : {})
            },
            orderBy: [{ scope: 'asc' }, { name: 'asc' }]
        });
    }
    createTemplate(tenantId, data) {
        if (!data?.name)
            throw new common_1.BadRequestException('template name is required');
        if (!data?.columns)
            throw new common_1.BadRequestException('columns are required');
        return this.prisma.pricingTemplate.create({
            data: {
                name: data.name,
                workspace: data.workspace,
                scope: data.scope ?? 'GLOBAL',
                columns: data.columns,
                tenantId,
                opportunityId: data.opportunityId
            }
        });
    }
    updateTemplate(id, data) {
        return this.prisma.pricingTemplate.update({
            where: { id },
            data: {
                name: data.name,
                columns: data.columns
            }
        });
    }
    deleteTemplate(id) {
        return this.prisma.pricingTemplate.delete({ where: { id } });
    }
    createQuote(opportunityId, data) {
        return this.prisma.vendorQuote.create({
            data: {
                opportunityId,
                vendor: data.vendor,
                quoteNo: data.quoteNo,
                validity: data.validity ? new Date(data.validity) : undefined,
                leadTimeDays: data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : undefined,
                currency: data.currency,
                files: data.files
            }
        });
    }
    updateQuote(id, data) {
        return this.prisma.vendorQuote.update({
            where: { id },
            data: {
                vendor: data.vendor,
                quoteNo: data.quoteNo,
                validity: data.validity ? new Date(data.validity) : undefined,
                leadTimeDays: data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : undefined,
                currency: data.currency,
                files: data.files
            }
        });
    }
    async recalcPack(opportunityId, tenantId, overrides) {
        const items = await this.prisma.boQItem.findMany({ where: { opportunityId } });
        const rates = await this.prisma.fxRate.findMany({ where: { tenantId } });
        const rateMap = new Map(rates.map(r => [r.currency.toUpperCase(), r.rateToQar]));
        const baseCost = items.reduce((sum, i) => {
            const currency = (i.unitCurrency || 'QAR').toUpperCase();
            if (currency !== 'QAR' && !rateMap.has(currency)) {
                throw new common_1.BadRequestException(`Missing FX rate for ${currency}`);
            }
            const rate = currency === 'QAR' ? 1 : rateMap.get(currency) || 1;
            return sum + i.unitCost * rate * i.qty;
        }, 0);
        const overheads = overrides?.overheads ?? 0;
        const contingency = overrides?.contingency ?? 0;
        const fxRate = overrides?.fxRate ?? 1;
        const margin = overrides?.margin ?? 0.25;
        const withOverheads = baseCost * (1 + overheads);
        const withCont = withOverheads * (1 + contingency);
        const subtotal = withCont * fxRate;
        const totalPrice = subtotal * (1 + margin);
        const last = await this.prisma.pricingPack.findFirst({
            where: { opportunityId },
            orderBy: { version: 'desc' }
        });
        const version = (last?.version || 0) + 1;
        const pack = await this.prisma.pricingPack.create({
            data: {
                opportunityId,
                version,
                baseCost,
                overheads,
                contingency,
                fxRate,
                margin,
                totalPrice
            }
        });
        return { pack, baseCost, totalPrice };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map