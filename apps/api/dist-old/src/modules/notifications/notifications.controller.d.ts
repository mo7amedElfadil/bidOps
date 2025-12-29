import { NotificationChannel, NotificationDigestMode } from '@prisma/client';
import { NotificationsService } from './notifications.service';
declare class ListNotificationsQuery {
    status?: string;
    page?: number;
    pageSize?: number;
}
declare class PreferenceDto {
    activity: string;
    channel: NotificationChannel;
    digestMode?: NotificationDigestMode;
    enabled: boolean;
}
declare class SavePreferencesDto {
    items: PreferenceDto[];
}
declare class DefaultRoutingDto {
    activity: string;
    stage?: string;
    userIds?: string[];
    businessRoleIds?: string[];
}
declare class SaveDefaultsDto {
    items: DefaultRoutingDto[];
}
export declare class NotificationsController {
    private svc;
    constructor(svc: NotificationsService);
    list(query: ListNotificationsQuery, req: any): Promise<{
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
            payload: import("@prisma/client/runtime/library").JsonValue | null;
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
    count(req: any): Promise<{
        unread: number;
    }>;
    markRead(id: string, req: any): Promise<{
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
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        attempts: number;
        lastError: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        opportunityId: string | null;
        actorId: string | null;
    }>;
    markUnread(id: string, req: any): Promise<{
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
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        attempts: number;
        lastError: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        opportunityId: string | null;
        actorId: string | null;
    }>;
    markAllRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    preferences(req: any): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        activity: string;
        enabled: boolean;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        digestMode: import("@prisma/client").$Enums.NotificationDigestMode;
    }[]>;
    savePreferences(body: SavePreferencesDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        activity: string;
        enabled: boolean;
        channel: import("@prisma/client").$Enums.NotificationChannel;
        digestMode: import("@prisma/client").$Enums.NotificationDigestMode;
    }[]>;
    listDefaults(req: any): import("@prisma/client").Prisma.PrismaPromise<{
        stage: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        activity: string;
        userIds: string[];
        businessRoleIds: string[];
    }[]>;
    saveDefaults(body: SaveDefaultsDto, req: any): Promise<{
        stage: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        activity: string;
        userIds: string[];
        businessRoleIds: string[];
    }[]>;
    deleteDefault(id: string, req: any): Promise<{
        deleted: boolean;
    }>;
}
export {};
