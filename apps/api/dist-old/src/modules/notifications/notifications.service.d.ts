import { NotificationChannel, NotificationDigestMode, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
type DispatchInput = {
    activity: string;
    stage?: string;
    tenantId: string;
    subject: string;
    body: string;
    userIds?: string[];
    roleIds?: string[];
    mergeRoles?: boolean;
    includeDefaults?: boolean;
    opportunityId?: string;
    actorId?: string;
    payload?: Prisma.InputJsonValue;
    channels?: NotificationChannel[];
};
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getUsersByIds;
    private getUsersByBusinessRoles;
    private getDefaultRouting;
    resolveRecipients(input: {
        tenantId: string;
        activity: string;
        stage?: string;
        userIds?: string[];
        roleIds?: string[];
        mergeRoles?: boolean;
        includeDefaults?: boolean;
    }): Promise<{
        id: string;
        email: string;
        name: string;
    }[]>;
    private buildPreferenceMap;
    private shouldSend;
    dispatch(input: DispatchInput): Promise<{
        created: number;
        skipped: string;
    } | {
        created: number;
        skipped?: undefined;
    }>;
    listForUser(userId: string, tenantId: string, query: {
        status?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        items: {
            status: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            userId: string | null;
            activity: string | null;
            channel: import("@prisma/client").$Enums.NotificationChannel;
            type: string;
            to: string | null;
            subject: string | null;
            body: string | null;
            payload: Prisma.JsonValue | null;
            attempts: number;
            lastError: string | null;
            sentAt: Date | null;
            readAt: Date | null;
            opportunityId: string | null;
            actorId: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    markRead(id: string, userId: string, tenantId: string): Promise<{
        status: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        userId: string | null;
        activity: string | null;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        type: string;
        to: string | null;
        subject: string | null;
        body: string | null;
        payload: Prisma.JsonValue | null;
        attempts: number;
        lastError: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        opportunityId: string | null;
        actorId: string | null;
    }>;
    markUnread(id: string, userId: string, tenantId: string): Promise<{
        status: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        userId: string | null;
        activity: string | null;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        type: string;
        to: string | null;
        subject: string | null;
        body: string | null;
        payload: Prisma.JsonValue | null;
        attempts: number;
        lastError: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        opportunityId: string | null;
        actorId: string | null;
    }>;
    markAllRead(userId: string, tenantId: string): Promise<Prisma.BatchPayload>;
    countForUser(userId: string, tenantId: string): Promise<number>;
    listPreferences(userId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        activity: string;
        enabled: boolean;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        digestMode: import("@prisma/client").$Enums.NotificationDigestMode;
    }[]>;
    savePreferences(userId: string, entries: Array<{
        activity: string;
        channel: NotificationChannel;
        enabled: boolean;
        digestMode?: NotificationDigestMode;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        activity: string;
        enabled: boolean;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        digestMode: import("@prisma/client").$Enums.NotificationDigestMode;
    }[]>;
    listDefaults(tenantId: string): Prisma.PrismaPromise<{
        stage: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        activity: string;
        userIds: string[];
        businessRoleIds: string[];
    }[]>;
    saveDefaults(tenantId: string, entries: Array<{
        activity: string;
        stage?: string;
        userIds?: string[];
        businessRoleIds?: string[];
    }>): Promise<{
        stage: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        activity: string;
        userIds: string[];
        businessRoleIds: string[];
    }[]>;
    deleteDefault(tenantId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
