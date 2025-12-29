import { ComplianceService } from './compliance.service';
import { TenantService } from '../../tenant/tenant.service';
export declare class ComplianceController {
    private svc;
    private tenants;
    constructor(svc: ComplianceService, tenants: TenantService);
    list(opportunityId: string, req: any): Promise<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        owner: string | null;
        section: string | null;
        clauseNo: string | null;
        requirementText: string;
        mandatoryFlag: boolean;
        response: string | null;
        evidence: string | null;
    }[]>;
    importPdf(opportunityId: string, file: any, req: any): Promise<{
        created: number;
    }>;
    importCsv(opportunityId: string, file: any, req: any): Promise<{
        created: number;
    }>;
    update(id: string, body: any): Promise<{
        status: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        opportunityId: string;
        owner: string | null;
        section: string | null;
        clauseNo: string | null;
        requirementText: string;
        mandatoryFlag: boolean;
        response: string | null;
        evidence: string | null;
    }>;
    exportCsv(opportunityId: string, res: any, req: any): Promise<void>;
}
