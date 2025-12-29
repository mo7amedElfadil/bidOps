import { TenantService } from '../../tenant/tenant.service';
import { OutcomesService } from './outcomes.service';
export declare class OutcomesController {
    private svc;
    private tenants;
    constructor(svc: OutcomesService, tenants: TenantService);
    get(opportunityId: string, req: any): import("@prisma/client").Prisma.Prisma__OutcomeClient<{
        status: import("@prisma/client").$Enums.OutcomeStatus;
        notes: string | null;
        id: string;
        createdAt: Date;
        opportunityId: string;
        date: Date;
        winner: string | null;
        awardValue: number | null;
        reasonCodes: string[];
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    set(opportunityId: string, body: any, req: any): import("@prisma/client").Prisma.Prisma__OutcomeClient<{
        status: import("@prisma/client").$Enums.OutcomeStatus;
        notes: string | null;
        id: string;
        createdAt: Date;
        opportunityId: string;
        date: Date;
        winner: string | null;
        awardValue: number | null;
        reasonCodes: string[];
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
