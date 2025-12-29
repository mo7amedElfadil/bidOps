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
exports.AuthBootstrapService = void 0;
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuthBootstrapService = class AuthBootstrapService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        const provider = (process.env.AUTH_PROVIDER || 'local').toLowerCase();
        if (provider !== 'local')
            return;
        const tenantId = 'default';
        const adminCount = await this.prisma.user.count({
            where: { tenantId, role: client_1.Role.ADMIN }
        });
        if (adminCount > 0)
            return;
        const email = process.env.DEFAULT_ADMIN_EMAIL || 'elfadil@it-serve.qa';
        const password = process.env.DEFAULT_ADMIN_PASSWORD || 'P@ssword1';
        const passwordHash = await argon2.hash(password);
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: client_1.Role.ADMIN,
                    status: client_1.UserStatus.ACTIVE,
                    isActive: true,
                    passwordHash: existing.passwordHash || passwordHash,
                    mustChangePassword: true
                }
            });
            return;
        }
        await this.prisma.user.create({
            data: {
                email,
                name: 'Elfadil',
                role: client_1.Role.ADMIN,
                tenantId,
                passwordHash,
                status: client_1.UserStatus.ACTIVE,
                isActive: true,
                mustChangePassword: true
            }
        });
    }
};
exports.AuthBootstrapService = AuthBootstrapService;
exports.AuthBootstrapService = AuthBootstrapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthBootstrapService);
//# sourceMappingURL=auth.bootstrap.js.map