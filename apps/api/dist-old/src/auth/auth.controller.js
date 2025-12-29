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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const passport_1 = require("@nestjs/passport");
const argon2 = __importStar(require("argon2"));
const crypto = __importStar(require("crypto"));
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_decorator_1 = require("./roles.decorator");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const notifications_service_1 = require("../modules/notifications/notifications.service");
const notifications_constants_1 = require("../modules/notifications/notifications.constants");
const frontend_url_1 = require("../utils/frontend-url");
const branding_1 = require("shared/branding");
class InviteUserDto {
    email;
    name;
    role;
    userType;
    businessRoleIds;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], InviteUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER']),
    __metadata("design:type", String)
], InviteUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], InviteUserDto.prototype, "userType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], InviteUserDto.prototype, "businessRoleIds", void 0);
class InviteLinkDto {
    userId;
}
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], InviteLinkDto.prototype, "userId", void 0);
class AcceptInviteDto {
    token;
    name;
    password;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptInviteDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AcceptInviteDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AcceptInviteDto.prototype, "password", void 0);
class ForgotPasswordDto {
    email;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
    token;
    password;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
class ChangePasswordDto {
    currentPassword;
    newPassword;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
let AuthController = class AuthController {
    jwt;
    prisma;
    notifications;
    constructor(jwt, prisma, notifications) {
        this.jwt = jwt;
        this.prisma = prisma;
        this.notifications = notifications;
    }
    isLocalAuth() {
        return (process.env.AUTH_PROVIDER || 'local').toLowerCase() === 'local';
    }
    async register(body) {
        if (!this.isLocalAuth())
            throw new common_1.BadRequestException('Registration disabled (non-local auth)');
        if (!body.email || !body.password)
            throw new common_1.BadRequestException('email and password required');
        const exists = await this.prisma.user.findUnique({ where: { email: body.email } });
        if (exists)
            throw new common_1.BadRequestException('User already exists');
        const passwordHash = await argon2.hash(body.password);
        const user = await this.prisma.user.create({
            data: {
                email: body.email,
                name: body.name || body.email,
                role: 'VIEWER',
                tenantId: 'default',
                passwordHash,
                status: client_1.UserStatus.PENDING,
                isActive: false,
                passwordChangedAt: new Date()
            }
        });
        await this.queueUserSignupNotifications(user);
        return { id: user.id, email: user.email };
    }
    async login(body) {
        if (!this.isLocalAuth())
            throw new common_1.BadRequestException('Use OIDC login');
        const user = await this.prisma.user.findUnique({ where: { email: body.email } });
        if (!user?.passwordHash)
            throw new common_1.BadRequestException('Invalid credentials');
        if (user.status === client_1.UserStatus.PENDING)
            throw new common_1.BadRequestException('Account pending approval');
        if (user.status === client_1.UserStatus.INVITED)
            throw new common_1.BadRequestException('Account invite not accepted');
        if (user.status === client_1.UserStatus.DISABLED || user.isActive === false)
            throw new common_1.BadRequestException('Account is disabled');
        const ok = await argon2.verify(user.passwordHash, body.password);
        if (!ok)
            throw new common_1.BadRequestException('Invalid credentials');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        const token = await this.signToken(user);
        return { access_token: token };
    }
    async devLogin(body) {
        const tenantId = body.tenantId || 'default';
        let user = await this.prisma.user.findUnique({ where: { email: body.email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: body.email,
                    name: body.name || body.email,
                    role: body.role || 'VIEWER',
                    tenantId,
                    status: client_1.UserStatus.ACTIVE,
                    isActive: true
                }
            });
        }
        else if (user.isActive === false) {
            throw new common_1.BadRequestException('Account is disabled');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        const token = await this.signToken(user);
        return { access_token: token };
    }
    async invite(body, req) {
        const email = body.email.trim().toLowerCase();
        const tenantId = req.user?.tenantId || 'default';
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing && existing.status === client_1.UserStatus.ACTIVE) {
            throw new common_1.BadRequestException('User already active');
        }
        const user = existing
            ? await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    name: body.name || existing.name,
                    role: body.role || existing.role,
                    userType: body.userType || existing.userType,
                    status: client_1.UserStatus.INVITED,
                    isActive: false
                }
            })
            : await this.prisma.user.create({
                data: {
                    email,
                    name: body.name || email,
                    role: body.role || 'VIEWER',
                    tenantId,
                    userType: body.userType || 'INTERNAL',
                    status: client_1.UserStatus.INVITED,
                    isActive: false
                }
            });
        if (body.businessRoleIds?.length) {
            await this.assignBusinessRoles(user.id, body.businessRoleIds, tenantId);
        }
        const link = await this.createInviteLink(user.id, tenantId);
        const subject = 'You have been invited to BidOps';
        const appUrl = (0, branding_1.getAppBaseUrl)();
        await this.notifications.dispatch({
            activity: notifications_constants_1.NotificationActivities.AUTH_INVITE,
            tenantId,
            subject,
            body: 'You have been invited to BidOps. Use the secure link below to set your password.',
            userIds: [user.id],
            channels: [client_1.NotificationChannel.EMAIL, client_1.NotificationChannel.IN_APP],
            payload: {
                templateName: 'invite',
                templateData: {
                    SUBJECT: subject,
                    FIRST_NAME: user.name,
                    HERO_HEADLINE: 'Set up your BidOps access',
                    HERO_SUBTEXT: 'You were invited by your admin to collaborate on bids.',
                    BODY_INTRO: 'Click below to choose a password and start working with your team.',
                    POINT_1: 'Passwords are encrypted and stored securely.',
                    POINT_2: 'You can reset this link if needed.',
                    POINT_3: 'Contact support if anything looks wrong.',
                    CTA_URL: link,
                    CTA_TEXT: 'Set your password',
                    APP_LOGO_URL: (0, branding_1.getAppLogoUrl)()
                },
                actionUrl: link,
                actionLabel: 'Set your password'
            }
        });
        return { userId: user.id, link };
    }
    async inviteLink(body, req) {
        const tenantId = req.user?.tenantId || 'default';
        const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
        if (!user || user.tenantId !== tenantId) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.status !== client_1.UserStatus.INVITED) {
            throw new common_1.BadRequestException('User is not invited');
        }
        const link = await this.createInviteLink(user.id, tenantId);
        return { link };
    }
    async acceptInvite(body) {
        const tokenHash = this.hashToken(body.token);
        const invite = await this.prisma.inviteToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });
        if (!invite || invite.usedAt)
            throw new common_1.BadRequestException('Invite token is invalid or already used');
        if (invite.expiresAt < new Date())
            throw new common_1.BadRequestException('Invite token has expired');
        const passwordHash = await argon2.hash(body.password);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: invite.userId },
                data: {
                    name: body.name || invite.user.name,
                    passwordHash,
                    status: client_1.UserStatus.ACTIVE,
                    isActive: true,
                    mustChangePassword: false,
                    passwordChangedAt: new Date()
                }
            }),
            this.prisma.inviteToken.update({
                where: { id: invite.id },
                data: { usedAt: new Date() }
            })
        ]);
        return { ok: true };
    }
    async forgotPassword(body) {
        const email = body.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== client_1.UserStatus.ACTIVE) {
            return { ok: true };
        }
        await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        const token = this.generateToken();
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt }
        });
        const link = `${process.env.WEB_ORIGIN || 'http://localhost:8080'}/auth/reset-password?token=${encodeURIComponent(token)}`;
        await this.queueEmail({
            to: user.email,
            subject: 'Reset your BidOps password',
            body: `Use this link to reset your password:\n\n${link}\n\nThis link expires in 1 hour.`
        }, user, user.tenantId, 'auth.reset');
        return { ok: true };
    }
    async resetPassword(body) {
        const tokenHash = this.hashToken(body.token);
        const reset = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: true }
        });
        if (!reset || reset.usedAt)
            throw new common_1.BadRequestException('Reset token is invalid or already used');
        if (reset.expiresAt < new Date())
            throw new common_1.BadRequestException('Reset token has expired');
        const passwordHash = await argon2.hash(body.password);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: reset.userId },
                data: {
                    passwordHash,
                    mustChangePassword: false,
                    passwordChangedAt: new Date()
                }
            }),
            this.prisma.passwordResetToken.update({
                where: { id: reset.id },
                data: { usedAt: new Date() }
            })
        ]);
        return { ok: true };
    }
    async changePassword(body, req) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('Invalid user');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.passwordHash)
            throw new common_1.BadRequestException('Password not set');
        const ok = await argon2.verify(user.passwordHash, body.currentPassword);
        if (!ok)
            throw new common_1.BadRequestException('Current password invalid');
        const passwordHash = await argon2.hash(body.newPassword);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                mustChangePassword: false,
                passwordChangedAt: new Date()
            }
        });
        const token = await this.signToken(updated);
        return { ok: true, access_token: token };
    }
    oidcLogin() { }
    async oidcCallback(req, res) {
        const { email, name, tenantId, role } = req.user || {};
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: { email, name, role: role || 'VIEWER', tenantId: tenantId || 'default', status: client_1.UserStatus.ACTIVE, isActive: true }
            });
        }
        else if (user.isActive === false) {
            throw new common_1.BadRequestException('Account is disabled');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        const token = await this.signToken(user);
        const redirectUrl = process.env.AUTH_SUCCESS_REDIRECT || '/';
        res.redirect(`${redirectUrl}#token=${token}`);
    }
    async signToken(user) {
        return this.jwt.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            mustChangePassword: Boolean(user.mustChangePassword)
        });
    }
    generateToken() {
        return crypto.randomBytes(32).toString('base64url');
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async queueEmail(input, user, tenantId, type) {
        return this.prisma.notification.create({
            data: {
                type,
                channel: 'EMAIL',
                to: input.to,
                subject: input.subject,
                body: input.body,
                status: 'pending',
                userId: user?.id,
                tenantId
            }
        });
    }
    async createInviteLink(userId, tenantId) {
        await this.prisma.inviteToken.deleteMany({ where: { userId } });
        const token = this.generateToken();
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.inviteToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt
            }
        });
        return `${process.env.WEB_ORIGIN || 'http://localhost:8080'}/auth/accept-invite?token=${encodeURIComponent(token)}`;
    }
    async queueUserSignupNotifications(user) {
        const admins = await this.prisma.user.findMany({
            where: { tenantId: user.tenantId, role: client_1.Role.ADMIN, status: client_1.UserStatus.ACTIVE, isActive: true },
            select: { id: true }
        });
        const subject = 'New signup pending approval';
        const body = `A new user has signed up and is awaiting approval:\n\n${user.name} (${user.email})`;
        const formActionUrl = (0, frontend_url_1.buildFrontendUrl)('/admin/users');
        const adminIds = admins.map(admin => admin.id);
        if (adminIds.length) {
            await this.notifications.dispatch({
                activity: notifications_constants_1.NotificationActivities.AUTH_SIGNUP,
                tenantId: user.tenantId,
                subject,
                body,
                userIds: adminIds,
                channels: [client_1.NotificationChannel.EMAIL, client_1.NotificationChannel.IN_APP],
                payload: {
                    templateName: 'access-request',
                    templateData: {
                        SUBJECT: subject,
                        BODY_INTRO: 'A requester just signed up and is awaiting your approval.',
                        REQUESTER_NAME: user.name,
                        REQUESTER_EMAIL: user.email,
                        REQUESTED_ROLE: user.role,
                        TENANT: user.tenantId,
                        NEXT_ACTION: 'Review the new access request and approve or reject it.',
                        CTA_TEXT: 'Review access requests'
                    },
                    actionUrl: formActionUrl,
                    actionLabel: 'Review access requests'
                },
                includeDefaults: true
            });
        }
        await this.notifications.dispatch({
            activity: notifications_constants_1.NotificationActivities.AUTH_SIGNUP_PENDING,
            tenantId: user.tenantId,
            subject: 'Your BidOps account is pending approval',
            body: 'Thanks for signing up. An administrator will review your request shortly.',
            userIds: [user.id],
            channels: [client_1.NotificationChannel.EMAIL, client_1.NotificationChannel.IN_APP],
            payload: {
                templateName: 'access-status',
                templateData: {
                    SUBJECT: 'Access request pending',
                    HERO_HEADLINE: 'Your BidOps access request is pending review',
                    BODY_INTRO: 'Thanks for requesting access. We notified your administrators, and they will approve you shortly.',
                    STATUS_LABEL: 'Pending',
                    BODY_DETAILS: 'You will receive another email once your access is approved.',
                    CTA_URL: (0, frontend_url_1.buildFrontendUrl)('/notifications'),
                    CTA_TEXT: 'View notification center'
                },
                actionUrl: (0, frontend_url_1.buildFrontendUrl)('/notifications'),
                actionLabel: 'View notifications'
            }
        });
    }
    async assignBusinessRoles(userId, roleIds, tenantId) {
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
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('dev-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "devLogin", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [InviteUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('invite-link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [InviteLinkDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "inviteLink", null);
__decorate([
    (0, common_1.Post)('accept-invite'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AcceptInviteDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('login'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('oidc')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "oidcLogin", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('oidc')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oidcCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map