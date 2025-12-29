import { BusinessRolesService } from './business-roles.service';
export declare class BusinessRolesController {
    private svc;
    constructor(svc: BusinessRolesService);
    list(req: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(body: {
        name: string;
        description?: string;
    }, req: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: {
        name?: string;
        description?: string;
    }, req: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
