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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const tenant_service_1 = require("../../tenant/tenant.service");
const approvals_service_1 = require("./approvals.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const request_work_approval_dto_1 = require("./dto/request-work-approval.dto");
const approval_decision_dto_1 = require("./dto/approval-decision.dto");
const reject_work_approval_dto_1 = require("./dto/reject-work-approval.dto");
class ReviewApprovalsQuery {
    scope;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['mine', 'all']),
    __metadata("design:type", String)
], ReviewApprovalsQuery.prototype, "scope", void 0);
let ApprovalsController = class ApprovalsController {
    svc;
    tenants;
    constructor(svc, tenants) {
        this.svc = svc;
        this.tenants = tenants;
    }
    review(query, req) {
        return this.svc.reviewOverview(req.user?.tenantId || 'default', req.user || {}, query.scope);
    }
    async list(packId, req) {
        await this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default');
        return this.svc.list(packId);
    }
    request(body, req) {
        return this.svc.requestWorkApproval(body, req.user || {});
    }
    reject(body, req) {
        return this.svc.rejectWorkApproval(body, req.user || {});
    }
    async bootstrap(packId, body, req) {
        await this.tenants.ensurePackAccess(packId, req.user?.tenantId || 'default');
        return this.svc.bootstrap(packId, body?.chain);
    }
    decision(id, body, req) {
        const user = req.user;
        return this.svc.decision(id, user.id || 'unknown', user.role || 'VIEWER', body);
    }
    async finalize(packId, req) {
        const tenantId = req.user?.tenantId || 'default';
        await this.tenants.ensurePackAccess(packId, tenantId);
        return this.svc.finalize(packId, tenantId, req.user?.id);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Get)('review'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReviewApprovalsQuery, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "review", null);
__decorate([
    (0, common_1.Get)(':packId'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_work_approval_dto_1.RequestWorkApprovalDto, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "request", null);
__decorate([
    (0, common_1.Post)('reject'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reject_work_approval_dto_1.RejectWorkApprovalDto, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':packId/bootstrap'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "bootstrap", null);
__decorate([
    (0, common_1.Post)('decision/:id'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approval_decision_dto_1.ApprovalDecisionDto, Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "decision", null);
__decorate([
    (0, common_1.Post)(':packId/finalize'),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "finalize", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, common_1.Controller)('approvals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService, tenant_service_1.TenantService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map