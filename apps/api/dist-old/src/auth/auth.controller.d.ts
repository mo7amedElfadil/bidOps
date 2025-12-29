import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotificationsService } from '../modules/notifications/notifications.service';
declare class InviteUserDto {
    email: string;
    name?: string;
    role?: Role;
    userType?: string;
    businessRoleIds?: string[];
}
declare class InviteLinkDto {
    userId: string;
}
declare class AcceptInviteDto {
    token: string;
    name: string;
    password: string;
}
declare class ForgotPasswordDto {
    email: string;
}
declare class ResetPasswordDto {
    token: string;
    password: string;
}
declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class AuthController {
    private jwt;
    private prisma;
    private notifications;
    constructor(jwt: JwtService, prisma: PrismaService, notifications: NotificationsService);
    private isLocalAuth;
    register(body: {
        email: string;
        password: string;
        name?: string;
    }): Promise<{
        id: string;
        email: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
    }>;
    devLogin(body: {
        email: string;
        name?: string;
        role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
        tenantId?: string;
    }): Promise<{
        access_token: string;
    }>;
    invite(body: InviteUserDto, req: any): Promise<{
        userId: string;
        link: string;
    }>;
    inviteLink(body: InviteLinkDto, req: any): Promise<{
        link: string;
    }>;
    acceptInvite(body: AcceptInviteDto): Promise<{
        ok: boolean;
    }>;
    forgotPassword(body: ForgotPasswordDto): Promise<{
        ok: boolean;
    }>;
    resetPassword(body: ResetPasswordDto): Promise<{
        ok: boolean;
    }>;
    changePassword(body: ChangePasswordDto, req: any): Promise<{
        ok: boolean;
        access_token: string;
    }>;
    oidcLogin(): void;
    oidcCallback(req: any, res: any): Promise<void>;
    private signToken;
    private generateToken;
    private hashToken;
    private queueEmail;
    private createInviteLink;
    private queueUserSignupNotifications;
    private assignBusinessRoles;
}
export {};
