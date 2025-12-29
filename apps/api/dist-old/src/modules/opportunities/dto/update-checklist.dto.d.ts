declare class ChecklistItemDto {
    done?: boolean;
    attachmentId?: string;
    notes?: string;
}
export declare class UpdateChecklistDto {
    bondPurchased?: ChecklistItemDto;
    formsCompleted?: ChecklistItemDto;
    finalPdfReady?: ChecklistItemDto;
    portalCredentialsVerified?: ChecklistItemDto;
    complianceCreated?: ChecklistItemDto;
    clarificationsSent?: ChecklistItemDto;
    pricingApproved?: ChecklistItemDto;
}
export {};
