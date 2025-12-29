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
exports.ClarificationsController = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("../../tenant/tenant.service");
const clarifications_service_1 = require("./clarifications.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const platform_express_1 = require("@nestjs/platform-express");
let ClarificationsController = class ClarificationsController {
    svc;
    tenants;
    constructor(svc, tenants) {
        this.svc = svc;
        this.tenants = tenants;
    }
    list(opportunityId, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.list(opportunityId);
    }
    create(opportunityId, body, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.create(opportunityId, body);
    }
    importCsv(opportunityId, file, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.importCsv(opportunityId, file);
    }
    update(id, body) {
        return this.svc.update(id, body);
    }
    async export(opportunityId, res, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        const csv = await this.svc.exportCsv(opportunityId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=\"clarifications-${opportunityId}.csv\"`);
        res.send(csv);
    }
};
exports.ClarificationsController = ClarificationsController;
__decorate([
    (0, common_1.Get)(':opportunityId'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ClarificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':opportunityId'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ClarificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':opportunityId/import.csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ClarificationsController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Patch)('item/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ClarificationsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':opportunityId/export.csv'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ClarificationsController.prototype, "export", null);
exports.ClarificationsController = ClarificationsController = __decorate([
    (0, common_1.Controller)('clarifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [clarifications_service_1.ClarificationsService, tenant_service_1.TenantService])
], ClarificationsController);
//# sourceMappingURL=clarifications.controller.js.map