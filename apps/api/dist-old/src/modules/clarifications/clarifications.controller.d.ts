import { TenantService } from '../../tenant/tenant.service';
import { ClarificationsService } from './clarifications.service';
export declare class ClarificationsController {
    private svc;
    private tenants;
    constructor(svc: ClarificationsService, tenants: TenantService);
    list(opportunityId: string, req: any): import("@prisma/client").Prisma.PrismaPromise<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        file: string | null;
        text: string;
        questionNo: string;
        submittedOn: Date | null;
        responseOn: Date | null;
        responseText: string | null;
    }[]>;
    create(opportunityId: string, body: {
        questionNo: string;
        text: string;
        status?: string;
    }, req: any): import("@prisma/client").Prisma.Prisma__ClarificationClient<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        file: string | null;
        text: string;
        questionNo: string;
        submittedOn: Date | null;
        responseOn: Date | null;
        responseText: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    importCsv(opportunityId: string, file: any, req: any): Promise<{
        created: number;
    }>;
    update(id: string, body: any): import("@prisma/client").Prisma.Prisma__ClarificationClient<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        file: string | null;
        text: string;
        questionNo: string;
        submittedOn: Date | null;
        responseOn: Date | null;
        responseText: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    export(opportunityId: string, res: any, req: any): Promise<void>;
}
