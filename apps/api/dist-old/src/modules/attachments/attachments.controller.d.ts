import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../files/storage.interface';
import { SearchService } from '../../search/search.service';
declare class ListAttachmentsQuery {
    entityType: string;
    entityId: string;
    page?: number;
    pageSize?: number;
}
declare class UploadAttachmentDto {
    entityType: string;
    entityId: string;
}
export declare class AttachmentsController {
    private prisma;
    private storage;
    private search;
    constructor(prisma: PrismaService, storage: StorageService, search: SearchService);
    list(query: ListAttachmentsQuery, req: any): Promise<{
        items: {
            id: string;
            tenantId: string;
            createdAt: Date;
            version: number;
            hash: string;
            entityType: string;
            entityId: string;
            filename: string;
            size: number;
            storagePath: string;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    upload(file: any, body: UploadAttachmentDto, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        version: number;
        hash: string;
        entityType: string;
        entityId: string;
        filename: string;
        size: number;
        storagePath: string;
    }>;
    download(id: string, res: any, req: any): Promise<any>;
}
export {};
