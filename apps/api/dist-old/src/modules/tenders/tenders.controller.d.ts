import { TendersService } from './tenders.service';
declare class ListTendersQuery {
    q?: string;
    portal?: string;
    status?: string;
    scope?: string;
    scopes?: string;
    minScore?: number;
    isNew?: string;
    promoted?: string;
    goNoGoStatus?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}
declare class CreateTenderActivityDto {
    name: string;
    description?: string;
    scope: string;
    keywords?: string[];
    negativeKeywords?: string[];
    weight?: number;
    isHighPriority?: boolean;
    isActive?: boolean;
}
declare class UpdateTenderActivityDto {
    name?: string;
    description?: string;
    scope?: string;
    keywords?: string[];
    negativeKeywords?: string[];
    weight?: number;
    isHighPriority?: boolean;
    isActive?: boolean;
}
declare class ReprocessTenderClassificationDto {
    fromDate?: string;
    toDate?: string;
    portal?: string;
}
declare class TranslateTenderTitlesDto {
    fromDate?: string;
    toDate?: string;
    portal?: string;
    limit?: number;
    dryRun?: boolean;
}
declare class CreateTenderDto {
    portal: string;
    tenderRef?: string;
    title?: string;
    titleOriginal?: string;
    ministry?: string;
    publishDate?: string;
    closeDate?: string;
    requestedSectorType?: string;
    tenderBondValue?: string;
    documentsValue?: string;
    tenderType?: string;
    purchaseUrl?: string;
    sourceUrl?: string;
    status?: string;
}
declare class UpdateTenderDto {
    portal?: string;
    tenderRef?: string;
    title?: string;
    titleOriginal?: string;
    ministry?: string;
    publishDate?: string;
    closeDate?: string;
    requestedSectorType?: string;
    tenderBondValue?: string;
    documentsValue?: string;
    tenderType?: string;
    purchaseUrl?: string;
    sourceUrl?: string;
    status?: string;
}
export declare class TendersController {
    private svc;
    constructor(svc: TendersService);
    list(query: ListTendersQuery, req: any): Promise<{
        items: ({
            classification: {
                id: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                isNew: boolean;
                tenderId: string;
                classificationVersion: number;
                score: number;
                matchedActivityIds: string[];
                matchedScopes: import("@prisma/client").$Enums.TenderScope[];
                matchedKeywords: string[];
                reasons: string[];
            } | null;
        } & {
            title: string | null;
            tenderRef: string | null;
            status: string | null;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            portal: string;
            titleOriginal: string | null;
            ministry: string | null;
            publishDate: Date | null;
            closeDate: Date | null;
            requestedSectorType: string | null;
            tenderBondValue: number | null;
            documentsValue: number | null;
            tenderType: string | null;
            purchaseUrl: string | null;
            sourceUrl: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    listActivities(req: any): import("@prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        scope: import("@prisma/client").$Enums.TenderScope;
        keywords: string[];
        negativeKeywords: string[];
        weight: number | null;
        isHighPriority: boolean;
    }[]>;
    createActivity(body: CreateTenderActivityDto, req: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        scope: import("@prisma/client").$Enums.TenderScope;
        keywords: string[];
        negativeKeywords: string[];
        weight: number | null;
        isHighPriority: boolean;
    }>;
    updateActivity(id: string, body: UpdateTenderActivityDto, req: any): Promise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        scope: import("@prisma/client").$Enums.TenderScope;
        keywords: string[];
        negativeKeywords: string[];
        weight: number | null;
        isHighPriority: boolean;
    } | null>;
    reprocess(body: ReprocessTenderClassificationDto, req: any): Promise<{
        processed: number;
        errors: number;
        runId: string;
    }>;
    translateTitles(body: TranslateTenderTitlesDto, req: any): Promise<{
        limit: number;
        dryRun: boolean;
        portal: string | null;
        triggeredBy: string | null;
        scanned: number;
        translated: number;
        skipped: number;
        failed: number;
        errors: {
            tenderId: string;
            message: string;
        }[];
    }>;
    getClassification(id: string, req: any): Promise<{
        matchedActivities: ({
            description: string | null;
            id: string;
            name: string;
            isActive: boolean;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            scope: import("@prisma/client").$Enums.TenderScope;
            keywords: string[];
            negativeKeywords: string[];
            weight: number | null;
            isHighPriority: boolean;
        } | undefined)[];
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        isNew: boolean;
        tenderId: string;
        classificationVersion: number;
        score: number;
        matchedActivityIds: string[];
        matchedScopes: import("@prisma/client").$Enums.TenderScope[];
        matchedKeywords: string[];
        reasons: string[];
    } | null>;
    create(body: CreateTenderDto, req: any): Promise<{
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        portal: string;
        titleOriginal: string | null;
        ministry: string | null;
        publishDate: Date | null;
        closeDate: Date | null;
        requestedSectorType: string | null;
        tenderBondValue: number | null;
        documentsValue: number | null;
        tenderType: string | null;
        purchaseUrl: string | null;
        sourceUrl: string | null;
    }>;
    collect(body: {
        adapterId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        jobId: string | undefined;
        status: string;
    }>;
    get(id: string): import("@prisma/client").Prisma.Prisma__MinistryTenderClient<({
        classification: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isNew: boolean;
            tenderId: string;
            classificationVersion: number;
            score: number;
            matchedActivityIds: string[];
            matchedScopes: import("@prisma/client").$Enums.TenderScope[];
            matchedKeywords: string[];
            reasons: string[];
        } | null;
    } & {
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        portal: string;
        titleOriginal: string | null;
        ministry: string | null;
        publishDate: Date | null;
        closeDate: Date | null;
        requestedSectorType: string | null;
        tenderBondValue: number | null;
        documentsValue: number | null;
        tenderType: string | null;
        purchaseUrl: string | null;
        sourceUrl: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, body: UpdateTenderDto): Promise<{
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        portal: string;
        titleOriginal: string | null;
        ministry: string | null;
        publishDate: Date | null;
        closeDate: Date | null;
        requestedSectorType: string | null;
        tenderBondValue: number | null;
        documentsValue: number | null;
        tenderType: string | null;
        purchaseUrl: string | null;
        sourceUrl: string | null;
    }>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__MinistryTenderClient<{
        title: string | null;
        tenderRef: string | null;
        status: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        portal: string;
        titleOriginal: string | null;
        ministry: string | null;
        publishDate: Date | null;
        closeDate: Date | null;
        requestedSectorType: string | null;
        tenderBondValue: number | null;
        documentsValue: number | null;
        tenderType: string | null;
        purchaseUrl: string | null;
        sourceUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    promote(id: string, req: any): Promise<{
        clientId: string;
        title: string;
        description: string | null;
        tenderRef: string | null;
        boqTemplateId: string | null;
        packTemplateId: string | null;
        ownerId: string | null;
        submissionDate: Date | null;
        status: string | null;
        stage: string | null;
        priorityRank: number | null;
        daysLeft: number | null;
        modeOfSubmission: string | null;
        sourcePortal: string | null;
        bondRequired: boolean | null;
        validityDays: number | null;
        dataOwner: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        sourceTenderId: string | null;
        discoveryDate: Date | null;
        startDate: Date | null;
        bondAmount: number | null;
        goNoGoStatus: import("@prisma/client").$Enums.ApprovalStatus;
        goNoGoUpdatedAt: Date | null;
        bondReminderSentAt: Date | null;
        reviewFreezeReminderSentAt: Date | null;
        portalRehearsalReminderSentAt: Date | null;
        slaLastNotifiedLevel: string | null;
        slaLastNotifiedAt: Date | null;
    }>;
}
export {};
