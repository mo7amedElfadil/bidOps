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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const prisma_service_1 = require("../../prisma/prisma.service");
const storage_interface_1 = require("../../files/storage.interface");
const search_service_1 = require("../../search/search.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const pagination_1 = require("../../utils/pagination");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ListAttachmentsQuery {
    entityType;
    entityId;
    page;
    pageSize;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAttachmentsQuery.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAttachmentsQuery.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListAttachmentsQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListAttachmentsQuery.prototype, "pageSize", void 0);
class UploadAttachmentDto {
    entityType;
    entityId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadAttachmentDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadAttachmentDto.prototype, "entityId", void 0);
let AttachmentsController = class AttachmentsController {
    prisma;
    storage;
    search;
    constructor(prisma, storage, search) {
        this.prisma = prisma;
        this.storage = storage;
        this.search = search;
    }
    list(query, req) {
        const { page: p, pageSize: size, skip } = (0, pagination_1.parsePagination)(query, 25, 200);
        const where = { entityType: query.entityType, entityId: query.entityId, tenantId: req.user?.tenantId || 'default' };
        return this.prisma.$transaction([
            this.prisma.attachment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: size
            }),
            this.prisma.attachment.count({ where })
        ]).then(([items, total]) => ({ items, total, page: p, pageSize: size }));
    }
    async upload(file, body, req) {
        const tenantId = req.user?.tenantId || 'default';
        const { entityType, entityId } = body;
        const info = await this.storage.uploadBuffer(process.env.ATTACHMENTS_CONTAINER || 'attachments', file.buffer, file.originalname);
        const row = await this.prisma.attachment.create({
            data: {
                entityType,
                entityId,
                filename: file.originalname,
                size: info.size,
                hash: info.hash,
                storagePath: info.path,
                tenantId
            }
        });
        try {
            await this.search.indexAttachment({
                id: row.id,
                filename: row.filename,
                path: row.storagePath,
                size: row.size,
                hash: row.hash,
                createdAt: row.createdAt.toISOString(),
                tenantId
            });
        }
        catch { }
        return row;
    }
    async download(id, res, req) {
        const attachment = await this.prisma.attachment.findFirst({
            where: { id, tenantId: req.user?.tenantId || 'default' }
        });
        if (!attachment)
            return res.status(404).send('Attachment not found');
        const buffer = await this.storage.downloadBuffer(process.env.ATTACHMENTS_CONTAINER || 'attachments', attachment.storagePath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
        return res.send(buffer);
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListAttachmentsQuery, Object]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN', 'CONTRIBUTOR'),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UploadAttachmentDto, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "download", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, common_1.Controller)('attachments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(1, (0, common_1.Inject)(storage_interface_1.STORAGE_SERVICE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, search_service_1.SearchService])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map