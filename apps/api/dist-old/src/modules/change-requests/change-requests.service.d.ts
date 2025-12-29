import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';
export declare class ChangeRequestsService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    list(filters: {
        opportunityId?: string;
        status?: string;
    }, tenantId: string): import("@prisma/client").Prisma.PrismaPromise<{
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        changes: string;
        impact: string | null;
        requestedById: string | null;
    }[]>;
    create(dto: CreateChangeRequestDto, userId: string, tenantId: string): Promise<{
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        changes: string;
        impact: string | null;
        requestedById: string | null;
    }>;
    update(id: string, dto: UpdateChangeRequestDto): import("@prisma/client").Prisma.Prisma__ChangeRequestClient<{
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        changes: string;
        impact: string | null;
        requestedById: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
