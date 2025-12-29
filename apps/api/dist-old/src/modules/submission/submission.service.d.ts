import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../files/storage.interface';
export declare class SubmissionService {
    private prisma;
    private storage;
    constructor(prisma: PrismaService, storage: StorageService);
    build(opportunityId: string): Promise<{
        path: string;
        checksum: string;
        count: number;
    }>;
}
