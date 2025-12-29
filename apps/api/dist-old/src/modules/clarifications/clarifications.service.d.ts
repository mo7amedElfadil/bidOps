import { PrismaService } from '../../prisma/prisma.service';
export declare class ClarificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(opportunityId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    create(opportunityId: string, data: {
        questionNo: string;
        text: string;
        status?: string;
    }): import("@prisma/client").Prisma.Prisma__ClarificationClient<{
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
    update(id: string, data: Partial<{
        text: string;
        status: string;
        responseText: string;
        submittedOn: string;
        responseOn: string;
    }>): import("@prisma/client").Prisma.Prisma__ClarificationClient<{
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
    exportCsv(opportunityId: string): Promise<string>;
    importCsv(opportunityId: string, file: any): Promise<{
        created: number;
    }>;
}
