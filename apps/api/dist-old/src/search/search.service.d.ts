import { OnModuleInit } from '@nestjs/common';
export declare class SearchService implements OnModuleInit {
    private host;
    private logger;
    onModuleInit(): Promise<void>;
    private createIndex;
    indexAttachment(doc: {
        id: string;
        filename: string;
        path: string;
        size: number;
        hash: string;
        createdAt: string;
        tenantId: string;
    }): Promise<void>;
    searchAttachments(query: string, tenantId: string): Promise<any>;
}
