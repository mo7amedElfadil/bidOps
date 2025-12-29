import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    list(query: {
        q?: string;
        page?: number;
        pageSize?: number;
    }, tenantId: string): Promise<{
        items: {
            businessRoles: {
                id: string;
                name: string;
            }[];
            status: import("@prisma/client").$Enums.UserStatus;
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            team: string | null;
            passwordHash: string | null;
            isActive: boolean;
            mustChangePassword: boolean;
            lastLoginAt: Date | null;
            passwordChangedAt: Date | null;
            userType: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    get(id: string): Promise<{
        businessRoles: {
            id: string;
            name: string;
        }[];
        status: import("@prisma/client").$Enums.UserStatus;
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        team: string | null;
        passwordHash: string | null;
        isActive: boolean;
        mustChangePassword: boolean;
        lastLoginAt: Date | null;
        passwordChangedAt: Date | null;
        userType: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(data: {
        email?: string;
        name?: string;
        role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
        team?: string;
        password?: string;
        isActive?: boolean;
        status?: 'ACTIVE' | 'DISABLED' | 'INVITED' | 'PENDING';
        mustChangePassword?: boolean;
        userType?: string;
        businessRoleIds?: string[];
        tenantId: string;
    }): Promise<{
        status: import("@prisma/client").$Enums.UserStatus;
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        team: string | null;
        passwordHash: string | null;
        isActive: boolean;
        mustChangePassword: boolean;
        lastLoginAt: Date | null;
        passwordChangedAt: Date | null;
        userType: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: {
        email?: string;
        name?: string;
        role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
        team?: string;
        password?: string;
        isActive?: boolean;
        status?: 'ACTIVE' | 'DISABLED' | 'INVITED' | 'PENDING';
        mustChangePassword?: boolean;
        userType?: string;
        businessRoleIds?: string[];
    }): Promise<{
        status: import("@prisma/client").$Enums.UserStatus;
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        team: string | null;
        passwordHash: string | null;
        isActive: boolean;
        mustChangePassword: boolean;
        lastLoginAt: Date | null;
        passwordChangedAt: Date | null;
        userType: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setBusinessRoles(userId: string, roleIds: string[], tenantId: string): Promise<{
        businessRoleIds: string[];
    }>;
    private generateDefaultEmail;
    delete(id: string): Promise<{
        status: import("@prisma/client").$Enums.UserStatus;
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        team: string | null;
        passwordHash: string | null;
        isActive: boolean;
        mustChangePassword: boolean;
        lastLoginAt: Date | null;
        passwordChangedAt: Date | null;
        userType: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteMany(ids: string[]): Promise<{
        deleted: number;
    }>;
}
