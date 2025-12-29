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
exports.BusinessRolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BusinessRolesService = class BusinessRolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(tenantId) {
        return this.ensureDefaults(tenantId).then(() => this.prisma.businessRole.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        }));
    }
    async ensureDefaults(tenantId) {
        const count = await this.prisma.businessRole.count({ where: { tenantId } });
        if (count > 0)
            return;
        const defaults = [
            'Bid Manager',
            'Team Member',
            'Project Manager',
            'Sales Manager',
            'Executive'
        ];
        await this.prisma.businessRole.createMany({
            data: defaults.map(name => ({ name, tenantId })),
            skipDuplicates: true
        });
    }
    async create(data, tenantId) {
        const name = data.name?.trim();
        if (!name)
            throw new common_1.BadRequestException('Role name is required');
        const exists = await this.prisma.businessRole.findUnique({
            where: { tenantId_name: { tenantId, name } }
        });
        if (exists)
            throw new common_1.BadRequestException('Role already exists');
        return this.prisma.businessRole.create({
            data: {
                name,
                description: data.description?.trim() || undefined,
                tenantId
            }
        });
    }
    async update(id, data, tenantId) {
        const role = await this.prisma.businessRole.findUnique({ where: { id } });
        if (!role || role.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Role not found');
        }
        const updateData = {};
        if (data.name !== undefined) {
            const name = data.name.trim();
            if (!name)
                throw new common_1.BadRequestException('Role name cannot be empty');
            const exists = await this.prisma.businessRole.findUnique({
                where: { tenantId_name: { tenantId, name } }
            });
            if (exists && exists.id !== id)
                throw new common_1.BadRequestException('Role name already exists');
            updateData.name = name;
        }
        if (data.description !== undefined) {
            updateData.description = data.description?.trim() || undefined;
        }
        return this.prisma.businessRole.update({ where: { id }, data: updateData });
    }
    async remove(id, tenantId) {
        const role = await this.prisma.businessRole.findUnique({ where: { id } });
        if (!role || role.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Role not found');
        }
        await this.prisma.userBusinessRole.deleteMany({ where: { businessRoleId: id } });
        return this.prisma.businessRole.delete({ where: { id } });
    }
};
exports.BusinessRolesService = BusinessRolesService;
exports.BusinessRolesService = BusinessRolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessRolesService);
//# sourceMappingURL=business-roles.service.js.map