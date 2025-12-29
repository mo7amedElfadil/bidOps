import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../files/storage.interface';
export declare class AiService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
    extract(payload: {
        opportunityId: string;
        attachmentIds: string[];
        prompt: string;
        provider?: 'openai' | 'gemini';
        outputs?: {
            compliance?: boolean;
            clarifications?: boolean;
            proposal?: boolean;
        };
    }, tenantId: string): Promise<{
        provider: "openai" | "gemini";
        model: string | undefined;
        attachmentsUsed: number;
        unsupported: string[];
        complianceCreated: number;
        clarificationsCreated: number;
        proposalCreated: number;
    }>;
    private extractText;
    private buildPrompt;
    private safeJson;
    private callOpenAI;
    private callGemini;
}
