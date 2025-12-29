import { PrismaService } from '../../prisma/prisma.service';
export declare class OutcomesService {
    private prisma;
    constructor(prisma: PrismaService);
    get(opportunityId: string): import("@prisma/client").Prisma.Prisma__OutcomeClient<{
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
    set(opportunityId: string, data: {
        status: 'WON' | 'LOST' | 'WITHDRAWN' | 'CANCELLED';
        date?: string;
        winner?: string;
        awardValue?: number;
        notes?: string;
        reasonCodes?: string[];
    }): import("@prisma/client").Prisma.Prisma__OutcomeClient<{
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
