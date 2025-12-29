import { PrismaService } from '../../prisma/prisma.service';
import { BlobService } from '../../files/blob.service';
export declare class ComplianceService {
    private prisma;
    private blob;
    constructor(prisma: PrismaService, blob: BlobService);
    list(opportunityId: string): Promise<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        owner: string | null;
        section: string | null;
        clauseNo: string | null;
        requirementText: string;
        mandatoryFlag: boolean;
        response: string | null;
        evidence: string | null;
    }[]>;
    update(id: string, data: Partial<{
        response: string;
        status: string;
        owner: string;
        evidence: string;
        mandatoryFlag: boolean;
    }>): Promise<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        owner: string | null;
        section: string | null;
        clauseNo: string | null;
        requirementText: string;
        mandatoryFlag: boolean;
        response: string | null;
        evidence: string | null;
    }>;
    importPdf(opportunityId: string, file: any): Promise<{
        created: number;
    }>;
    importCsv(opportunityId: string, file: any): Promise<{
        created: number;
    }>;
    exportCsv(opportunityId: string): Promise<string>;
}
