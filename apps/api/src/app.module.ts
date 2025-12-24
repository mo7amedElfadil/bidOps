import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaService } from './prisma/prisma.service';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ImportModule } from './modules/import/import.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { SearchModule } from './search/search.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ClarificationsModule } from './modules/clarifications/clarifications.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { OutcomesModule } from './modules/outcomes/outcomes.module';
import { AwardsModule } from './modules/awards/awards.module';
import { TendersModule } from './modules/tenders/tenders.module';
import { UsersModule } from './modules/users/users.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TenantModule } from './tenant/tenant.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RolesGuard } from './auth/roles.guard';
import { AiModule } from './modules/ai/ai.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module';
import { BusinessRolesModule } from './modules/business-roles/business-roles.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
	imports: [
		ThrottlerModule.forRoot([{
			ttl: Number(process.env.RATE_LIMIT_TTL || 60),
			limit: Number(process.env.RATE_LIMIT_LIMIT || 120)
		}]),
		TenantModule,
		AuthModule, OpportunitiesModule, ClientsModule, ImportModule, SettingsModule, AttachmentsModule, SearchModule, ComplianceModule, ClarificationsModule, PricingModule, ApprovalsModule, SubmissionModule, OutcomesModule, AwardsModule, TendersModule, UsersModule, AnalyticsModule, AiModule, ProposalModule, ChangeRequestsModule, BusinessRolesModule, NotificationsModule
	],
	controllers: [HealthController],
	providers: [
		PrismaService,
		{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
		{ provide: 'APP_GUARD', useClass: ThrottlerGuard },
		{ provide: 'APP_GUARD', useClass: RolesGuard }
	]
})
export class AppModule { }
