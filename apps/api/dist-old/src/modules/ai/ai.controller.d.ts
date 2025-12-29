import { AiService } from './ai.service';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
    extract(body: {
        opportunityId: string;
        attachmentIds: string[];
        prompt: string;
        provider?: 'openai' | 'gemini';
        outputs?: {
            compliance?: boolean;
            clarifications?: boolean;
            proposal?: boolean;
        };
    }, req: any): Promise<{
        provider: "openai" | "gemini";
        model: string | undefined;
        attachmentsUsed: number;
        unsupported: string[];
        complianceCreated: number;
        clarificationsCreated: number;
        proposalCreated: number;
    }>;
}
