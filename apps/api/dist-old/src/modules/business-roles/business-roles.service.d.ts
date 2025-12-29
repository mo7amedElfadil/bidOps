import { PrismaService } from '../../prisma/prisma.service';
export declare class BusinessRolesService {
    private prisma;
    constructor(prisma: PrismaService);
    list(tenantId: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    private ensureDefaults;
    create(data: {
        name: string;
        description?: string;
    }, tenantId: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
    }, tenantId: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, tenantId: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
