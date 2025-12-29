import { AwardsService } from './awards.service';
declare class ListStagingQuery {
    q?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}
declare class ListEventsQuery {
    q?: string;
    page?: number;
    pageSize?: number;
}
export declare class AwardsController {
    private svc;
    constructor(svc: AwardsService);
    staging(query: ListStagingQuery): Promise<{
        items: {
            client: string | null;
            title: string | null;
            tenderRef: string | null;
            status: string | null;
            notes: string | null;
            id: string;
            createdAt: Date;
            portal: string;
            titleOriginal: string | null;
            closeDate: Date | null;
            sourceUrl: string | null;
            awardValue: number | null;
            awardDate: Date | null;
            winners: string[];
            codes: string[];
            rawPath: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    createStaging(body: any): import("@prisma/client").Prisma.Prisma__AwardStagingClient<{
        client: string | null;
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        notes: string | null;
        id: string;
        createdAt: Date;
        portal: string;
        titleOriginal: string | null;
        closeDate: Date | null;
        sourceUrl: string | null;
        awardValue: number | null;
        awardDate: Date | null;
        winners: string[];
        codes: string[];
        rawPath: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    updateStaging(id: string, body: any): import("@prisma/client").Prisma.Prisma__AwardStagingClient<{
        client: string | null;
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        notes: string | null;
        id: string;
        createdAt: Date;
        portal: string;
        titleOriginal: string | null;
        closeDate: Date | null;
        sourceUrl: string | null;
        awardValue: number | null;
        awardDate: Date | null;
        winners: string[];
        codes: string[];
        rawPath: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    removeStaging(id: string): import("@prisma/client").Prisma.Prisma__AwardStagingClient<{
        client: string | null;
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        notes: string | null;
        id: string;
        createdAt: Date;
        portal: string;
        titleOriginal: string | null;
        closeDate: Date | null;
        sourceUrl: string | null;
        awardValue: number | null;
        awardDate: Date | null;
        winners: string[];
        codes: string[];
        rawPath: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    curate(id: string): Promise<{
        client: string | null;
        title: string | null;
        tenderRef: string | null;
        id: string;
        createdAt: Date;
        portal: string;
        titleOriginal: string | null;
        sourceUrl: string | null;
        awardValue: number | null;
        awardDate: Date | null;
        winners: string[];
        codes: string[];
    } | null>;
    collect(body: {
        adapterId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        jobId: string | undefined;
        status: string;
    }>;
    events(query: ListEventsQuery): Promise<{
        items: {
            client: string | null;
            title: string | null;
            tenderRef: string | null;
            id: string;
            createdAt: Date;
            portal: string;
            titleOriginal: string | null;
            sourceUrl: string | null;
            awardValue: number | null;
            awardDate: Date | null;
            winners: string[];
            codes: string[];
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    updateEvent(id: string, body: any): import("@prisma/client").Prisma.Prisma__AwardEventClient<{
        client: string | null;
        title: string | null;
        tenderRef: string | null;
        id: string;
        createdAt: Date;
        portal: string;
        titleOriginal: string | null;
        sourceUrl: string | null;
        awardValue: number | null;
        awardDate: Date | null;
        winners: string[];
        codes: string[];
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    removeEvent(id: string): import("@prisma/client").Prisma.Prisma__AwardEventClient<{
        client: string | null;
        title: string | null;
        tenderRef: string | null;
        id: string;
        createdAt: Date;
        portal: string;
        titleOriginal: string | null;
        sourceUrl: string | null;
        awardValue: number | null;
        awardDate: Date | null;
        winners: string[];
        codes: string[];
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
export {};
