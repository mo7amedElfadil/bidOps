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
exports.ProposalController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const tenant_service_1 = require("../../tenant/tenant.service");
let ProposalController = class ProposalController {
    prisma;
    tenants;
    constructor(prisma, tenants) {
        this.prisma = prisma;
        this.tenants = tenants;
    }
    async list(opportunityId, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.prisma.proposalSection.findMany({
            where: { opportunityId },
            orderBy: [{ createdAt: 'asc' }]
        });
    }
    async export(opportunityId, res, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        const sections = await this.prisma.proposalSection.findMany({
            where: { opportunityId },
            orderBy: [{ createdAt: 'asc' }]
        });
        const headers = ['SectionNo', 'Title', 'Content', 'Meta'];
        const lines = [headers.join(',')];
        for (const section of sections) {
            const line = [
                escape(section.sectionNo || ''),
                escape(section.title || ''),
                escape(section.content || ''),
                escape(JSON.stringify(section.meta || {}))
            ].join(',');
            lines.push(line);
        }
        const csv = lines.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="proposal-${opportunityId}.csv"`);
        res.send(csv);
    }
};
exports.ProposalController = ProposalController;
__decorate([
    (0, common_1.Get)(':opportunityId'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProposalController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':opportunityId/export.csv'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProposalController.prototype, "export", null);
exports.ProposalController = ProposalController = __decorate([
    (0, common_1.Controller)('proposal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, tenant_service_1.TenantService])
], ProposalController);
function escape(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=proposal.controller.js.map