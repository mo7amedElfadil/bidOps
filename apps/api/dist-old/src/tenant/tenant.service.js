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
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TenantService = class TenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureOpportunityAccess(opportunityId, tenantId) {
        const opp = await this.prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { tenantId: true } });
        if (!opp) {
            throw new common_1.NotFoundException('Opportunity not found');
        }
        if (opp.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Access denied for this opportunity');
        }
    }
    async ensurePackAccess(packId, tenantId) {
        const pack = await this.prisma.pricingPack.findUnique({
            where: { id: packId },
            select: { opportunity: { select: { tenantId: true } } }
        });
        if (!pack || !pack.opportunity?.tenantId) {
            throw new common_1.NotFoundException('Pricing pack not found');
        }
        const packTenant = pack.opportunity.tenantId;
        if (packTenant !== tenantId) {
            throw new common_1.ForbiddenException('Access denied for this pricing pack');
        }
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map