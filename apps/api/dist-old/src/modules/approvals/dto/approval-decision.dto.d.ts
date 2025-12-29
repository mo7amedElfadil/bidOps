declare const STATUSES: readonly ["PENDING", "IN_REVIEW", "CHANGES_REQUESTED", "RESUBMITTED", "APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED"];
export declare class ApprovalDecisionDto {
    status: typeof STATUSES[number];
    comment?: string;
    attachments?: string[];
    changesRequestedDueDate?: string;
}
export {};
