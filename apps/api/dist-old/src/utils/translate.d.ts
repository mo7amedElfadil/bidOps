export type TranslationResult = {
    translated: string;
    original?: string;
};
export declare function containsArabic(text?: string | null): boolean;
export declare function translateArabicStrict(text?: string | null): Promise<TranslationResult>;
