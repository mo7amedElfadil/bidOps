import { ClientsService } from './clients.service';
declare class CreateClientDto {
    name: string;
    sector?: string;
    tenantId?: string;
}
declare class ListClientsQuery {
    page?: number;
    pageSize?: number;
}
export declare class ClientsController {
    private readonly service;
    constructor(service: ClientsService);
    list(req: any, query: ListClientsQuery): Promise<{
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
    create(body: CreateClientDto, req: any): import("@prisma/client").Prisma.Prisma__ClientClient<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        sector: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
export {};
