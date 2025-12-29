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
exports.OpportunitiesController = void 0;
const common_1 = require("@nestjs/common");
const opportunities_service_1 = require("./opportunities.service");
const create_opportunity_dto_1 = require("./dto/create-opportunity.dto");
const set_bid_owners_dto_1 = require("./dto/set-bid-owners.dto");
const update_opportunity_dto_1 = require("./dto/update-opportunity.dto");
const query_opportunity_dto_1 = require("./dto/query-opportunity.dto");
const update_checklist_dto_1 = require("./dto/update-checklist.dto");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const tenant_service_1 = require("../../tenant/tenant.service");
let OpportunitiesController = class OpportunitiesController {
    service;
    tenants;
    constructor(service, tenants) {
        this.service = service;
        this.tenants = tenants;
    }
    list(query, req) {
        return this.service.list(query, req.user?.tenantId || 'default', req.user?.id || req.user?.userId);
    }
    create(body, req) {
        return this.service.create(body, req.user?.tenantId || 'default');
    }
    update(id, body, req) {
        this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default');
        return this.service.update(id, body, req.user?.tenantId || 'default');
    }
    setBidOwners(id, body, req) {
        this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default');
        return this.service.setBidOwners(id, body.userIds || [], req.user?.tenantId || 'default');
    }
    remove(id, req) {
        this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default');
        return this.service.delete(id);
    }
    getChecklist(id, req) {
        this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default');
        return this.service.getChecklist(id);
    }
    updateChecklist(id, body, req) {
        this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default');
        return this.service.updateChecklist(id, body, req.user?.id || 'unknown');
    }
    get(id, req) {
        this.tenants.ensureOpportunityAccess(id, req.user?.tenantId || 'default');
        return this.service.get(id);
    }
};
exports.OpportunitiesController = OpportunitiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_opportunity_dto_1.QueryOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_opportunity_dto_1.CreateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_opportunity_dto_1.UpdateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/bid-owners'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_bid_owners_dto_1.SetBidOwnersDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "setBidOwners", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/checklist'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "getChecklist", null);
__decorate([
    (0, common_1.Patch)(':id/checklist'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_checklist_dto_1.UpdateChecklistDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "updateChecklist", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "get", null);
exports.OpportunitiesController = OpportunitiesController = __decorate([
    (0, common_1.Controller)('opportunities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [opportunities_service_1.OpportunitiesService, tenant_service_1.TenantService])
], OpportunitiesController);
//# sourceMappingURL=opportunities.controller.js.map