import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private svc;
    constructor(svc: AnalyticsService);
    awards(res: any): Promise<void>;
    reportContext(): Promise<{
        summary: string;
        trends: string[];
        recommendations: string[];
    }>;
    opportunities(req: any, res: any): Promise<void>;
    onboarding(req: any): Promise<{
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
