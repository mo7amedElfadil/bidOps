"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query, tenantId) {
        const page = Math.max(1, Number(query.page || 1));
        const pageSize = Math.min(200, Math.max(1, Number(query.pageSize || 25)));
        const skip = (page - 1) * pageSize;
        const where = { tenantId };
        if (query.q) {
            const like = { contains: query.q, mode: 'insensitive' };
            where.OR = [
                { email: like },
                { name: like },
                { team: like }
            ];
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                include: {
                    businessRoleLinks: { include: { businessRole: true } }
                }
            }),
            this.prisma.user.count({ where })
        ]);
        const mapped = items.map(user => {
            const { businessRoleLinks, ...rest } = user;
            return {
                ...rest,
                businessRoles: businessRoleLinks.map(link => ({
                    id: link.businessRole.id,
                    name: link.businessRole.name
                }))
            };
        });
        return { items: mapped, total, page, pageSize };
    }
    async get(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { businessRoleLinks: { include: { businessRole: true } } }
        });
        if (!user)
            return null;
        const { businessRoleLinks, ...rest } = user;
        return {
            ...rest,
            businessRoles: businessRoleLinks.map(link => ({
                id: link.businessRole.id,
                name: link.businessRole.name
            }))
        };
    }
    async create(data) {
        let email = data.email?.trim();
        const name = data.name?.trim();
        if (!email) {
            if (!name)
                throw new common_1.BadRequestException('email or name is required');
            email = await this.generateDefaultEmail(name);
        }
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (exists)
            throw new common_1.BadRequestException('User already exists');
        const passwordHash = data.password ? await argon2.hash(data.password) : undefined;
        const status = data.status || (data.isActive === false ? 'DISABLED' : 'ACTIVE');
        const isActive = data.isActive !== undefined ? data.isActive : status === 'ACTIVE';
        const created = await this.prisma.user.create({
            data: {
                email,
                name: name || email,
                role: data.role || 'VIEWER',
                team: data.team,
                passwordHash,
                isActive,
                status: status,
                mustChangePassword: data.mustChangePassword ?? false,
                passwordChangedAt: data.password ? new Date() : undefined,
                userType: data.userType || 'INTERNAL',
                tenantId: data.tenantId
            }
        });
        if (data.businessRoleIds?.length) {
            await this.setBusinessRoles(created.id, data.businessRoleIds, data.tenantId);
        }
        return created;
    }
    async update(id, data) {
        const updateData = {
            name: data.name,
            role: data.role,
            team: data.team,
            isActive: data.isActive,
            userType: data.userType
        };
        if (data.status) {
            updateData.status = data.status;
            updateData.isActive = data.isActive !== undefined ? data.isActive : data.status === 'ACTIVE';
        }
        if (data.mustChangePassword !== undefined) {
            updateData.mustChangePassword = data.mustChangePassword;
        }
        if (data.email) {
            const email = data.email.trim();
            const exists = await this.prisma.user.findUnique({ where: { email } });
            if (exists && exists.id !== id) {
                throw new common_1.BadRequestException('Email already in use');
            }
            updateData.email = email;
        }
        if (data.password) {
            updateData.passwordHash = await argon2.hash(data.password);
            updateData.passwordChangedAt = new Date();
            updateData.mustChangePassword = false;
        }
        const updated = await this.prisma.user.update({ where: { id }, data: updateData });
        if (data.businessRoleIds) {
            await this.setBusinessRoles(id, data.businessRoleIds, updated.tenantId);
        }
        return updated;
    }
    async setBusinessRoles(userId, roleIds, tenantId) {
        const roles = await this.prisma.businessRole.findMany({
            where: { tenantId, id: { in: roleIds } },
            select: { id: true }
        });
        const validRoleIds = roles.map(role => role.id);
        await this.prisma.$transaction([
            this.prisma.userBusinessRole.deleteMany({ where: { userId } }),
            ...(validRoleIds.length
                ? [
                    this.prisma.userBusinessRole.createMany({
                        data: validRoleIds.map(businessRoleId => ({ userId, businessRoleId })),
                        skipDuplicates: true
                    })
                ]
                : [])
        ]);
        return { businessRoleIds: validRoleIds };
    }
    async generateDefaultEmail(fullName) {
        const base = fullName
            .split(/\s+/)
            .filter(Boolean)[0]
            .replace(/[^a-zA-Z]/g, '')
            .toLowerCase() || 'user';
        const domain = 'it-serve.qa';
        let candidate = `${base}@${domain}`;
        let suffix = 2;
        while (await this.prisma.user.findUnique({ where: { email: candidate } })) {
            candidate = `${base}${suffix}@${domain}`;
            suffix += 1;
        }
        return candidate;
    }
    async delete(id) {
        await this.prisma.$transaction([
            this.prisma.opportunity.updateMany({
                where: { ownerId: id },
                data: { ownerId: null }
            }),
            this.prisma.opportunityBidOwner.deleteMany({ where: { userId: id } })
        ]);
        return this.prisma.user.delete({ where: { id } });
    }
    async deleteMany(ids) {
        if (!ids.length) {
            return { deleted: 0 };
        }
        const [, , result] = await this.prisma.$transaction([
            this.prisma.opportunity.updateMany({
                where: { ownerId: { in: ids } },
                data: { ownerId: null }
            }),
            this.prisma.opportunityBidOwner.deleteMany({ where: { userId: { in: ids } } }),
            this.prisma.user.deleteMany({ where: { id: { in: ids } } })
        ]);
        return { deleted: result.count };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map