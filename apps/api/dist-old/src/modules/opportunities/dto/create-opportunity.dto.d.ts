export declare class CreateOpportunityDto {
    clientId?: string;
    clientName?: string;
    title: string;
    description?: string;
    tenderRef?: string;
    boqTemplateId?: string;
    packTemplateId?: string;
    ownerId?: string;
    submissionDate?: string;
    status?: string;
    stage?: string;
    priorityRank?: number;
    daysLeft?: number;
    modeOfSubmission?: string;
    sourcePortal?: string;
    bondRequired?: boolean;
    validityDays?: number;
    dataOwner?: string;
}
