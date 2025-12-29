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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const storage_interface_1 = require("../../files/storage.interface");
const archiver = require('archiver');
const crypto_1 = require("crypto");
let SubmissionService = class SubmissionService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async build(opportunityId) {
        const attachments = await this.prisma.attachment.findMany({
            where: { entityType: 'Opportunity', entityId: opportunityId },
            orderBy: { createdAt: 'asc' }
        });
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks = [];
        archive.on('data', (d) => chunks.push(Buffer.from(d)));
        const manifest = { generatedAt: new Date().toISOString(), files: [] };
        for (const a of attachments) {
            manifest.files.push({
                filename: a.filename,
                storagePath: a.storagePath,
                size: a.size,
                hash: a.hash
            });
        }
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
        await archive.finalize();
        const zipBuffer = Buffer.concat(chunks);
        const checksum = (0, crypto_1.createHash)('sha256').update(zipBuffer).digest('hex');
        const uploaded = await this.storage.uploadBuffer('submission-packs', zipBuffer, `submission-${opportunityId}.zip`);
        return { path: uploaded.path, checksum, count: attachments.length };
    }
};
exports.SubmissionService = SubmissionService;
exports.SubmissionService = SubmissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(storage_interface_1.STORAGE_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], SubmissionService);
//# sourceMappingURL=submission.service.js.map