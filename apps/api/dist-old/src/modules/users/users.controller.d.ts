import { UsersService } from './users.service';
declare class ListUsersQuery {
    q?: string;
    page?: number;
    pageSize?: number;
}
declare class CreateUserDto {
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
}
declare class UpdateUserDto {
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
}
declare class SetBusinessRolesDto {
    roleIds: string[];
}
declare class BulkDeleteUsersDto {
    ids: string[];
}
export declare class UsersController {
    private svc;
    constructor(svc: UsersService);
    list(query: ListUsersQuery, req: any): Promise<{
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
    getMe(req: any): Promise<{
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
    create(body: CreateUserDto, req: any): Promise<{
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
    update(id: string, body: UpdateUserDto): Promise<{
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
    setBusinessRoles(id: string, body: SetBusinessRolesDto, req: any): Promise<{
        businessRoleIds: string[];
    }>;
    bulkRemove(body: BulkDeleteUsersDto): Promise<{
        deleted: number;
    }>;
    remove(id: string): Promise<{
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
}
export {};
