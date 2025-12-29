import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../../tenant/tenant.service';
export declare class ProposalController {
    private readonly prisma;
    private tenants;
    constructor(prisma: PrismaService, tenants: TenantService);
    list(opportunityId: string, req: any): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        sectionNo: string | null;
        content: string;
        sourcePrompt: string | null;
        sourceAttachments: string[];
        provider: string | null;
        model: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    export(opportunityId: string, res: any, req: any): Promise<void>;
}
