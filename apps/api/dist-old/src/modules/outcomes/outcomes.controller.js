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
exports.OutcomesController = void 0;
const common_1 = require("@nestjs/common");
const tenant_service_1 = require("../../tenant/tenant.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const outcomes_service_1 = require("./outcomes.service");
let OutcomesController = class OutcomesController {
    svc;
    tenants;
    constructor(svc, tenants) {
        this.svc = svc;
        this.tenants = tenants;
    }
    get(opportunityId, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.get(opportunityId);
    }
    set(opportunityId, body, req) {
        this.tenants.ensureOpportunityAccess(opportunityId, req.user?.tenantId || 'default');
        return this.svc.set(opportunityId, body);
    }
};
exports.OutcomesController = OutcomesController;
__decorate([
    (0, common_1.Get)(':opportunityId'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OutcomesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(':opportunityId'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OutcomesController.prototype, "set", null);
exports.OutcomesController = OutcomesController = __decorate([
    (0, common_1.Controller)('outcomes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [outcomes_service_1.OutcomesService, tenant_service_1.TenantService])
], OutcomesController);
//# sourceMappingURL=outcomes.controller.js.map