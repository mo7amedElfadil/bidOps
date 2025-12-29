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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClarificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const sync_1 = require("csv-parse/sync");
let ClarificationsService = class ClarificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(opportunityId) {
        return this.prisma.clarification.findMany({
            where: { opportunityId },
            orderBy: [{ questionNo: 'asc' }]
        });
    }
    create(opportunityId, data) {
        return this.prisma.clarification.create({
            data: { opportunityId, questionNo: data.questionNo, text: data.text, status: data.status || 'open' }
        });
    }
    update(id, data) {
        return this.prisma.clarification.update({
            where: { id },
            data: {
                text: data.text,
                status: data.status,
                responseText: data.responseText,
                submittedOn: data.submittedOn ? new Date(data.submittedOn) : undefined,
                responseOn: data.responseOn ? new Date(data.responseOn) : undefined
            }
        });
    }
    async exportCsv(opportunityId) {
        const rows = await this.list(opportunityId);
        const headers = ['QuestionNo', 'Text', 'Status', 'SubmittedOn', 'ResponseOn', 'ResponseText'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            const line = [
                esc(r.questionNo),
                esc(r.text),
                esc(r.status || ''),
                esc(r.submittedOn ? r.submittedOn.toISOString().slice(0, 10) : ''),
                esc(r.responseOn ? r.responseOn.toISOString().slice(0, 10) : ''),
                esc(r.responseText || '')
            ].join(',');
            lines.push(line);
        }
        return lines.join('\n');
    }
    async importCsv(opportunityId, file) {
        if (!file)
            throw new common_1.BadRequestException('file is required');
        const text = file.buffer.toString('utf-8');
        const records = (0, sync_1.parse)(text, { columns: true, skip_empty_lines: true, trim: true });
        const createData = records.map((row, index) => ({
            opportunityId,
            questionNo: row['QuestionNo']?.toString()?.trim() || String(index + 1),
            text: row['Text']?.toString()?.trim() || '',
            status: row['Status']?.toString()?.trim() || undefined,
            submittedOn: row['SubmittedOn'] ? new Date(row['SubmittedOn']) : undefined,
            responseOn: row['ResponseOn'] ? new Date(row['ResponseOn']) : undefined,
            responseText: row['ResponseText']?.toString()?.trim() || undefined
        })).filter(row => row.text);
        if (!createData.length) {
            throw new common_1.BadRequestException('No valid clarification rows found in CSV');
        }
        await this.prisma.clarification.createMany({ data: createData });
        return { created: createData.length };
    }
};
exports.ClarificationsService = ClarificationsService;
exports.ClarificationsService = ClarificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClarificationsService);
function esc(s) {
    if (s.includes(',') || s.includes('"') || s.includes('\n'))
        return '"' + s.replace(/"/g, '""') + '"';
    return s;
}
//# sourceMappingURL=clarifications.service.js.map