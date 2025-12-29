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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("../../tenant/tenant.service");
const pricing_service_1 = require("./pricing.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
let PricingController = class PricingController {
    svc;
    tenants;
    constructor(svc, tenants) {
        this.svc = svc;
        this.tenants = tenants;
    }
    listBoq(opportunityId, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.listBoq(opportunityId);
    }
    createBoq(opportunityId, body, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.createBoq(opportunityId, body);
    }
    updateBoq(id, body) {
        return this.svc.updateBoq(id, body);
    }
    deleteBoq(id) {
        return this.svc.deleteBoq(id);
    }
    listQuotes(opportunityId, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.listQuotes(opportunityId);
    }
    createQuote(opportunityId, body, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.createQuote(opportunityId, body);
    }
    updateQuote(id, body) {
        return this.svc.updateQuote(id, body);
    }
    listPackRows(opportunityId, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.listPackRows(opportunityId);
    }
    createPackRow(opportunityId, body, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.createPackRow(opportunityId, body);
    }
    updatePackRow(id, body) {
        return this.svc.updatePackRow(id, body);
    }
    deletePackRow(id) {
        return this.svc.deletePackRow(id);
    }
    listTemplates(req, query) {
        const tenantId = req.user?.tenantId || 'default';
        const { workspace, opportunityId } = query || {};
        return this.svc.listTemplates(tenantId, workspace, opportunityId);
    }
    createTemplate(body, req) {
        const tenantId = req.user?.tenantId || 'default';
        return this.svc.createTemplate(tenantId, body);
    }
    updateTemplate(id, body) {
        return this.svc.updateTemplate(id, body);
    }
    deleteTemplate(id) {
        return this.svc.deleteTemplate(id);
    }
    recalc(opportunityId, body, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.recalcPack(opportunityId, req.user?.tenantId || 'default', body);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Get)(':opportunityId/boq'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listBoq", null);
__decorate([
    (0, common_1.Post)(':opportunityId/boq'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createBoq", null);
__decorate([
    (0, common_1.Patch)('boq/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "updateBoq", null);
__decorate([
    (0, common_1.Delete)('boq/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "deleteBoq", null);
__decorate([
    (0, common_1.Get)(':opportunityId/quotes'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listQuotes", null);
__decorate([
    (0, common_1.Post)(':opportunityId/quotes'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createQuote", null);
__decorate([
    (0, common_1.Patch)('quotes/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "updateQuote", null);
__decorate([
    (0, common_1.Get)(':opportunityId/pack-rows'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listPackRows", null);
__decorate([
    (0, common_1.Post)(':opportunityId/pack-rows'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createPackRow", null);
__decorate([
    (0, common_1.Patch)('pack-rows/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "updatePackRow", null);
__decorate([
    (0, common_1.Delete)('pack-rows/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "deletePackRow", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)(':opportunityId/pack/recalculate'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "recalc", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)('pricing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pricing_service_1.PricingService, tenant_service_1.TenantService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map