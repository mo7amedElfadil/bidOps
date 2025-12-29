import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    exportAwardsCsv(): Promise<string>;
    generateReportContext(): Promise<{
        summary: string;
        trends: string[];
        recommendations: string[];
    }>;
    exportOpportunitiesCsv(tenantId: string): Promise<string>;
    getOnboardingMetrics(tenantId: string): Promise<{
        startedAt: Date | null;
        usersCompletedAt: Date | null;
        rolesCompletedAt: Date | null;
        defaultsCompletedAt: Date | null;
        durationsHours: {
            users: number | null;
            roles: number | null;
            defaults: number | null;
            overall: number | null;
        };
        approvalsTurnaround: {
            count: number;
            averageHours: number | null;
            medianHours: number | null;
            lateCount: number;
        };
    }>;
}
