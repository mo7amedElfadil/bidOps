"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const parser_tools_1 = require("@itsq-bidops/parser-tools");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const blob_service_1 = require("../../files/blob.service");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const sync_1 = require("csv-parse/sync");
let ComplianceService = class ComplianceService {
    prisma;
    blob;
    constructor(prisma, blob) {
        this.prisma = prisma;
        this.blob = blob;
    }
    async list(opportunityId) {
        return this.prisma.complianceClause.findMany({
            where: { opportunityId },
            orderBy: [{ section: 'asc' }, { clauseNo: 'asc' }, { createdAt: 'asc' }]
        });
    }
    async update(id, data) {
        return this.prisma.complianceClause.update({
            where: { id },
            data
        });
    }
    async importPdf(opportunityId, file) {
        if (!file)
            throw new common_1.BadRequestException('file is required');
        const info = await this.blob.uploadBuffer(process.env.ATTACHMENTS_CONTAINER || 'attachments', file.buffer, file.originalname);
        const parsed = await (0, pdf_parse_1.default)(file.buffer).catch(() => ({ text: '' }));
        const text = parsed.text || '';
        const parts = (0, parser_tools_1.splitIntoClauses)(text);
        const createData = parts.slice(0, 500).map((t, i) => ({
            opportunityId,
            section: undefined,
            clauseNo: String(i + 1),
            requirementText: t,
            mandatoryFlag: false
        }));
        if (createData.length === 0) {
            createData.push({
                opportunityId,
                section: undefined,
                clauseNo: '1',
                requirementText: `See attached file: ${file.originalname} (${info.path})`,
                mandatoryFlag: false
            });
        }
        await this.prisma.complianceClause.createMany({ data: createData });
        return { created: createData.length };
    }
    async importCsv(opportunityId, file) {
        if (!file)
            throw new common_1.BadRequestException('file is required');
        const text = file.buffer.toString('utf-8');
        const records = (0, sync_1.parse)(text, { columns: true, skip_empty_lines: true, trim: true });
        const createData = records.map((row, index) => ({
            opportunityId,
            section: row['Section']?.toString()?.trim() || undefined,
            clauseNo: row['ClauseNo']?.toString()?.trim() || String(index + 1),
            requirementText: row['Requirement']?.toString()?.trim() || '',
            mandatoryFlag: String(row['Mandatory'] || '').toLowerCase() === 'yes',
            response: row['Response']?.toString()?.trim() || undefined,
            status: row['Status']?.toString()?.trim() || undefined,
            owner: row['Owner']?.toString()?.trim() || undefined,
            evidence: row['Evidence']?.toString()?.trim() || undefined
        })).filter(row => row.requirementText);
        if (!createData.length) {
            throw new common_1.BadRequestException('No valid compliance rows found in CSV');
        }
        await this.prisma.complianceClause.createMany({ data: createData });
        return { created: createData.length };
    }
    async exportCsv(opportunityId) {
        const rows = await this.list(opportunityId);
        const headers = ['ClauseNo', 'Section', 'Mandatory', 'Requirement', 'Response', 'Status', 'Owner', 'Evidence'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            const line = [
                escapeCsv(r.clauseNo || ''),
                escapeCsv(r.section || ''),
                escapeCsv(r.mandatoryFlag ? 'Yes' : 'No'),
                escapeCsv(r.requirementText),
                escapeCsv(r.response || ''),
                escapeCsv(r.status || ''),
                escapeCsv(r.owner || ''),
                escapeCsv(r.evidence || '')
            ].join(',');
            lines.push(line);
        }
        return lines.join('\n');
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, blob_service_1.BlobService])
], ComplianceService);
function escapeCsv(s) {
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}
//# sourceMappingURL=compliance.service.js.map