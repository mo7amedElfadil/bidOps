"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const health_controller_1 = require("./health/health.controller");
const prisma_service_1 = require("./prisma/prisma.service");
const opportunities_module_1 = require("./modules/opportunities/opportunities.module");
const clients_module_1 = require("./modules/clients/clients.module");
const import_module_1 = require("./modules/import/import.module");
const settings_module_1 = require("./modules/settings/settings.module");
const attachments_module_1 = require("./modules/attachments/attachments.module");
const auth_module_1 = require("./auth/auth.module");
const core_1 = require("@nestjs/core");
const audit_interceptor_1 = require("./interceptors/audit.interceptor");
const search_module_1 = require("./search/search.module");
const compliance_module_1 = require("./modules/compliance/compliance.module");
const clarifications_module_1 = require("./modules/clarifications/clarifications.module");
const pricing_module_1 = require("./modules/pricing/pricing.module");
const approvals_module_1 = require("./modules/approvals/approvals.module");
const submission_module_1 = require("./modules/submission/submission.module");
const outcomes_module_1 = require("./modules/outcomes/outcomes.module");
const awards_module_1 = require("./modules/awards/awards.module");
const tenders_module_1 = require("./modules/tenders/tenders.module");
const users_module_1 = require("./modules/users/users.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const tenant_module_1 = require("./tenant/tenant.module");
const throttler_1 = require("@nestjs/throttler");
const roles_guard_1 = require("./auth/roles.guard");
const ai_module_1 = require("./modules/ai/ai.module");
const proposal_module_1 = require("./modules/proposal/proposal.module");
const change_requests_module_1 = require("./modules/change-requests/change-requests.module");
const business_roles_module_1 = require("./modules/business-roles/business-roles.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: Number(process.env.RATE_LIMIT_TTL || 60),
                    limit: Number(process.env.RATE_LIMIT_LIMIT || 120)
                }]),
            tenant_module_1.TenantModule,
            auth_module_1.AuthModule, opportunities_module_1.OpportunitiesModule, clients_module_1.ClientsModule, import_module_1.ImportModule, settings_module_1.SettingsModule, attachments_module_1.AttachmentsModule, search_module_1.SearchModule, compliance_module_1.ComplianceModule, clarifications_module_1.ClarificationsModule, pricing_module_1.PricingModule, approvals_module_1.ApprovalsModule, submission_module_1.SubmissionModule, outcomes_module_1.OutcomesModule, awards_module_1.AwardsModule, tenders_module_1.TendersModule, users_module_1.UsersModule, analytics_module_1.AnalyticsModule, ai_module_1.AiModule, proposal_module_1.ProposalModule, change_requests_module_1.ChangeRequestsModule, business_roles_module_1.BusinessRolesModule, notifications_module_1.NotificationsModule
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            prisma_service_1.PrismaService,
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_interceptor_1.AuditInterceptor },
            { provide: 'APP_GUARD', useClass: throttler_1.ThrottlerGuard },
            { provide: 'APP_GUARD', useClass: roles_guard_1.RolesGuard }
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map