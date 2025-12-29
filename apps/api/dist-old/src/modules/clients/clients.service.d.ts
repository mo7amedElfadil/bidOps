import { PrismaService } from '../../prisma/prisma.service';
export declare class ClientsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(tenantId: string, query?: {
        page?: number;
        pageSize?: number;
    }): Promise<{
        items: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            sector: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(input: {
        name: string;
        sector?: string;
    }, tenantId: string): import("@prisma/client").Prisma.Prisma__ClientClient<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        sector: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
