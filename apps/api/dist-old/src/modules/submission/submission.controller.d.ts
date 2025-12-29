import { TenantService } from '../../tenant/tenant.service';
import { SubmissionService } from './submission.service';
export declare class SubmissionController {
    private svc;
    private tenants;
    constructor(svc: SubmissionService, tenants: TenantService);
    build(opportunityId: string, req: any): Promise<{
        path: string;
        checksum: string;
        count: number;
    }>;
}
