import { Queue } from 'bullmq';
export declare const collectorsQueue: Queue<any, any, string, any, any, string>;
export type CollectorJobPayload = {
    adapterId?: string;
    fromDate?: string;
    toDate?: string;
};
export declare function enqueueAwardCollector(payload: CollectorJobPayload): Promise<import("bullmq").Job<any, any, string>>;
export declare function enqueueTenderCollector(payload: CollectorJobPayload): Promise<import("bullmq").Job<any, any, string>>;
