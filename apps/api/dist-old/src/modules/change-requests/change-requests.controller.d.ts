import { ChangeRequestsService } from './change-requests.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';
export declare class ChangeRequestsController {
    private service;
    constructor(service: ChangeRequestsService);
    list(opportunityId: string | undefined, status: string | undefined, req: any): import("@prisma/client").Prisma.PrismaPromise<{
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        changes: string;
        impact: string | null;
        requestedById: string | null;
    }[]>;
    create(body: CreateChangeRequestDto, req: any): Promise<{
        status: import("@prisma/client").$Enums.ChangeRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        changes: string;
        impact: string | null;
        requestedById: string | null;
    }>;
    update(id: string, body: UpdateChangeRequestDto): import("@prisma/client").Prisma.Prisma__ChangeRequestClient<{
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
