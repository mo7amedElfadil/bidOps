import { PrismaService } from '../prisma/prisma.service';
export declare class TenantService {
    private prisma;
    constructor(prisma: PrismaService);
    ensureOpportunityAccess(opportunityId: string, tenantId: string): Promise<void>;
    ensurePackAccess(packId: string, tenantId: string): Promise<void>;
}
