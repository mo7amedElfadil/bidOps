declare const STATUSES: readonly ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];
export declare class UpdateChangeRequestDto {
    status?: typeof STATUSES[number];
    impact?: string;
}
export {};
