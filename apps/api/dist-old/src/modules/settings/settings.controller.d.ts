import { PrismaService } from '../../prisma/prisma.service';
export declare class SettingsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSla(): Promise<{
        warnDays: number;
        alertDays: number;
        urgentDays: number;
    }>;
    setSla(body: {
        warnDays?: number;
        alertDays?: number;
        urgentDays?: number;
    }): Promise<{
        warnDays: number;
        alertDays: number;
        urgentDays: number;
    }>;
    getHolidays(): Promise<{
        dates: any[];
    }>;
    setHolidays(body: {
        dates?: string[];
    }): Promise<{
        dates: string[];
    }>;
    getRetention(): Promise<{
        years: number;
    }>;
    setRetention(body: {
        years?: number;
    }): Promise<{
        years: number;
    }>;
    getTimezone(): Promise<{
        offsetHours: number;
    }>;
    setTimezone(body: {
        offsetHours?: number;
    }): Promise<{
        offsetHours: number;
    }>;
    getOpportunityStages(): Promise<{
        stages: any[];
    }>;
    setOpportunityStages(body: {
        stages?: string[];
    }): Promise<{
        stages: string[];
    }>;
    getOpportunityStatuses(): Promise<{
        statuses: any[];
    }>;
    setOpportunityStatuses(body: {
        statuses?: string[];
    }): Promise<{
        statuses: string[];
    }>;
    private getList;
    private cleanList;
    getImportDateFormat(): Promise<{
        format: string;
    }>;
    setImportDateFormat(body: {
        format?: string;
    }): Promise<{
        format: string;
    }>;
    getSocials(): Promise<{
        linkedin: string;
        x: string;
        instagram: string;
        youtube: string;
    }>;
    setSocials(body: {
        linkedin?: string;
        x?: string;
        instagram?: string;
        youtube?: string;
    }): Promise<{
        linkedin: string;
        x: string;
        instagram: string;
        youtube: string;
    }>;
    listFxRates(req: any): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        currency: string;
        rateToQar: number;
    }[]>;
    upsertFxRate(body: {
        currency: string;
        rateToQar: number;
    }, req: any): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        currency: string;
        rateToQar: number;
    }>;
    updateFxRate(id: string, body: {
        rateToQar?: number;
    }): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        currency: string;
        rateToQar: number;
    }>;
    deleteFxRate(id: string): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        currency: string;
        rateToQar: number;
    }>;
}
