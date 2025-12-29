import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
type StagingFilters = {
    fromDate?: string;
    toDate?: string;
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
};
export declare class AwardsService {
    private prisma;
    constructor(prisma: PrismaService);
    listStaging(filters?: StagingFilters): Promise<{
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
    createStaging(data: any): Prisma.Prisma__AwardStagingClient<{
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
    updateStaging(id: string, data: any): Prisma.Prisma__AwardStagingClient<{
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
    deleteStaging(id: string): Prisma.Prisma__AwardStagingClient<{
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
    listEvents(query?: {
        page?: number;
        pageSize?: number;
        q?: string;
    }): Promise<{
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
    updateEvent(id: string, data: any): Prisma.Prisma__AwardEventClient<{
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
    deleteEvent(id: string): Prisma.Prisma__AwardEventClient<{
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
    triggerCollector(payload: {
        adapterId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        jobId: string | undefined;
        status: string;
    }>;
    triggerTenderCollector(payload: {
        adapterId?: string;
    }): Promise<{
        jobId: string | undefined;
        status: string;
    }>;
}
export {};
