import { PrismaService } from '../../prisma/prisma.service';
export declare class ImportController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    template(): string;
    importTracker(file?: any, req?: any): Promise<{
        clientsCreated: number;
        oppsUpserted: number;
        issues: {
            opportunityId: string;
            fieldName: string;
            columnName?: string;
            rowIndex: number;
            rawValue?: string;
            message: string;
        }[];
    }>;
    listIssues(req: any, opportunityId?: string, resolved?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        opportunityId: string;
        fieldName: string;
        resolvedAt: Date | null;
        columnName: string | null;
        rowIndex: number;
        rawValue: string | null;
        message: string;
    }[]>;
    resolveIssue(id: string): import("@prisma/client").Prisma.Prisma__ImportIssueClient<{
        id: string;
        createdAt: Date;
        opportunityId: string;
        fieldName: string;
        resolvedAt: Date | null;
        columnName: string | null;
        rowIndex: number;
        rawValue: string | null;
        message: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    private getImportDateFormat;
}
