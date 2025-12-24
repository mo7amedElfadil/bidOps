import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { AuthGuard } from '@nestjs/passport'
import * as argon2 from 'argon2'
import * as crypto from 'crypto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { Roles } from './roles.decorator'
import { Role, UserStatus } from '@prisma/client'
import { IsArray, IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

class InviteUserDto {
	@IsEmail()
	email!: string

	@IsOptional()
	@IsString()
	@MaxLength(200)
	name?: string

	@IsOptional()
	@IsString()
	@IsIn(['ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'])
	role?: Role

	@IsOptional()
	@IsString()
	@MaxLength(100)
	userType?: string

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	businessRoleIds?: string[]
}

class AcceptInviteDto {
	@IsString()
	token!: string

	@IsString()
	@MaxLength(200)
	name!: string

	@IsString()
	@MaxLength(200)
	password!: string
}

class ForgotPasswordDto {
	@IsEmail()
	email!: string
}

class ResetPasswordDto {
	@IsString()
	token!: string

	@IsString()
	@MaxLength(200)
	password!: string
}

class ChangePasswordDto {
	@IsString()
	currentPassword!: string

	@IsString()
	@MaxLength(200)
	newPassword!: string
}

@Controller('auth')
export class AuthController {
	constructor(private jwt: JwtService, private prisma: PrismaService) {}

	private isLocalAuth() {
		return (process.env.AUTH_PROVIDER || 'local').toLowerCase() === 'local'
	}

	@Post('register')
	async register(@Body() body: { email: string; password: string; name?: string }) {
		if (!this.isLocalAuth()) throw new BadRequestException('Registration disabled (non-local auth)')
		if (!body.email || !body.password) throw new BadRequestException('email and password required')
		const exists = await this.prisma.user.findUnique({ where: { email: body.email } })
		if (exists) throw new BadRequestException('User already exists')
		const passwordHash = await argon2.hash(body.password)
		const user = await this.prisma.user.create({
			data: {
				email: body.email,
				name: body.name || body.email,
				role: 'VIEWER',
				tenantId: 'default',
				passwordHash,
				status: UserStatus.PENDING,
				isActive: false,
				passwordChangedAt: new Date()
			}
		})
		await this.queueUserSignupNotifications(user)
		return { id: user.id, email: user.email }
	}

	@Post('login')
	async login(@Body() body: { email: string; password: string }) {
		if (!this.isLocalAuth()) throw new BadRequestException('Use OIDC login')
		const user = await this.prisma.user.findUnique({ where: { email: body.email } })
		if (!user?.passwordHash) throw new BadRequestException('Invalid credentials')
		if (user.status === UserStatus.PENDING) throw new BadRequestException('Account pending approval')
		if (user.status === UserStatus.INVITED) throw new BadRequestException('Account invite not accepted')
		if (user.status === UserStatus.DISABLED || user.isActive === false) throw new BadRequestException('Account is disabled')
		const ok = await argon2.verify(user.passwordHash, body.password)
		if (!ok) throw new BadRequestException('Invalid credentials')
		await this.prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() }
		})
		const token = await this.signToken(user)
		return { access_token: token }
	}

	// Dev-only login: create/find user by email and return a JWT
	@Post('dev-login')
	async devLogin(@Body() body: { email: string; name?: string; role?: 'ADMIN'|'MANAGER'|'CONTRIBUTOR'|'VIEWER'; tenantId?: string }) {
		const tenantId = body.tenantId || 'default'
		let user = await this.prisma.user.findUnique({ where: { email: body.email } })
		if (!user) {
			user = await this.prisma.user.create({
				data: {
					email: body.email,
					name: body.name || body.email,
					role: (body.role as any) || 'VIEWER',
					tenantId,
					status: UserStatus.ACTIVE,
					isActive: true
				}
			})
		} else if (user.isActive === false) {
			throw new BadRequestException('Account is disabled')
		}
		await this.prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() }
		})
		const token = await this.signToken(user)
		return { access_token: token }
	}

	@Post('invite')
	@UseGuards(JwtAuthGuard)
	@Roles('ADMIN')
	async invite(@Body() body: InviteUserDto, @Req() req: any) {
		const email = body.email.trim().toLowerCase()
		const tenantId = req.user?.tenantId || 'default'
		const existing = await this.prisma.user.findUnique({ where: { email } })
		if (existing && existing.status === UserStatus.ACTIVE) {
			throw new BadRequestException('User already active')
		}

		const user = existing
			? await this.prisma.user.update({
					where: { id: existing.id },
					data: {
						name: body.name || existing.name,
						role: (body.role as any) || existing.role,
						userType: body.userType || existing.userType,
						status: UserStatus.INVITED,
						isActive: false
					}
			  })
			: await this.prisma.user.create({
					data: {
						email,
						name: body.name || email,
						role: (body.role as any) || 'VIEWER',
						tenantId,
						userType: body.userType || 'INTERNAL',
						status: UserStatus.INVITED,
						isActive: false
					}
			  })

		if (body.businessRoleIds?.length) {
			await this.assignBusinessRoles(user.id, body.businessRoleIds, tenantId)
		}

		await this.prisma.inviteToken.deleteMany({ where: { userId: user.id } })
		const token = this.generateToken()
		const tokenHash = this.hashToken(token)
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
		await this.prisma.inviteToken.create({
			data: {
				userId: user.id,
				tokenHash,
				expiresAt
			}
		})

		const link = `${process.env.WEB_ORIGIN || 'http://localhost:8080'}/auth/accept-invite?token=${encodeURIComponent(token)}`
		await this.queueEmail({
			to: user.email,
			subject: 'You have been invited to BidOps',
			body: `You have been invited to BidOps. Use this link to set your password:\n\n${link}\n\nThis link expires in 24 hours.`
		}, user, tenantId, 'auth.invite')

		return { userId: user.id }
	}

	@Post('accept-invite')
	async acceptInvite(@Body() body: AcceptInviteDto) {
		const tokenHash = this.hashToken(body.token)
		const invite = await this.prisma.inviteToken.findUnique({
			where: { tokenHash },
			include: { user: true }
		})
		if (!invite || invite.usedAt) throw new BadRequestException('Invite token is invalid or already used')
		if (invite.expiresAt < new Date()) throw new BadRequestException('Invite token has expired')

		const passwordHash = await argon2.hash(body.password)
		await this.prisma.$transaction([
			this.prisma.user.update({
				where: { id: invite.userId },
				data: {
					name: body.name || invite.user.name,
					passwordHash,
					status: UserStatus.ACTIVE,
					isActive: true,
					mustChangePassword: false,
					passwordChangedAt: new Date()
				}
			}),
			this.prisma.inviteToken.update({
				where: { id: invite.id },
				data: { usedAt: new Date() }
			})
		])
		return { ok: true }
	}

	@Post('forgot-password')
	async forgotPassword(@Body() body: ForgotPasswordDto) {
		const email = body.email.trim().toLowerCase()
		const user = await this.prisma.user.findUnique({ where: { email } })
		if (!user || user.status !== UserStatus.ACTIVE) {
			return { ok: true }
		}
		await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
		const token = this.generateToken()
		const tokenHash = this.hashToken(token)
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
		await this.prisma.passwordResetToken.create({
			data: { userId: user.id, tokenHash, expiresAt }
		})
		const link = `${process.env.WEB_ORIGIN || 'http://localhost:8080'}/auth/reset-password?token=${encodeURIComponent(token)}`
		await this.queueEmail({
			to: user.email,
			subject: 'Reset your BidOps password',
			body: `Use this link to reset your password:\n\n${link}\n\nThis link expires in 1 hour.`
		}, user, user.tenantId, 'auth.reset')
		return { ok: true }
	}

	@Post('reset-password')
	async resetPassword(@Body() body: ResetPasswordDto) {
		const tokenHash = this.hashToken(body.token)
		const reset = await this.prisma.passwordResetToken.findUnique({
			where: { tokenHash },
			include: { user: true }
		})
		if (!reset || reset.usedAt) throw new BadRequestException('Reset token is invalid or already used')
		if (reset.expiresAt < new Date()) throw new BadRequestException('Reset token has expired')

		const passwordHash = await argon2.hash(body.password)
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
		])
		return { ok: true }
	}

	@Post('change-password')
	@UseGuards(JwtAuthGuard)
	async changePassword(@Body() body: ChangePasswordDto, @Req() req: any) {
		const userId = req.user?.id
		if (!userId) throw new BadRequestException('Invalid user')
		const user = await this.prisma.user.findUnique({ where: { id: userId } })
		if (!user?.passwordHash) throw new BadRequestException('Password not set')
		const ok = await argon2.verify(user.passwordHash, body.currentPassword)
		if (!ok) throw new BadRequestException('Current password invalid')
		const passwordHash = await argon2.hash(body.newPassword)
		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: {
				passwordHash,
				mustChangePassword: false,
				passwordChangedAt: new Date()
			}
		})
		const token = await this.signToken(updated)
		return { ok: true, access_token: token }
	}

	// OIDC login start
	@Get('login')
	@UseGuards(AuthGuard('oidc'))
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	oidcLogin() {}

	// OIDC callback -> issue local JWT
	@Get('callback')
	@UseGuards(AuthGuard('oidc'))
	async oidcCallback(@Req() req: any, @Res() res: any) {
		const { email, name, tenantId, role } = req.user || {}
		let user = await this.prisma.user.findUnique({ where: { email } })
		if (!user) {
			user = await this.prisma.user.create({
				data: { email, name, role: role || 'VIEWER', tenantId: tenantId || 'default', status: UserStatus.ACTIVE, isActive: true }
			})
		} else if (user.isActive === false) {
			throw new BadRequestException('Account is disabled')
		}
		await this.prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() }
		})
		const token = await this.signToken(user)
		const redirectUrl = process.env.AUTH_SUCCESS_REDIRECT || '/'
		res.redirect(`${redirectUrl}#token=${token}`)
	}

	private async signToken(user: { id: string; email: string; role: Role; tenantId: string; mustChangePassword?: boolean | null }) {
		return this.jwt.signAsync({
			sub: user.id,
			email: user.email,
			role: user.role,
			tenantId: user.tenantId,
			mustChangePassword: Boolean(user.mustChangePassword)
		})
	}

	private generateToken() {
		return crypto.randomBytes(32).toString('base64url')
	}

	private hashToken(token: string) {
		return crypto.createHash('sha256').update(token).digest('hex')
	}

	private async queueEmail(
		input: { to: string; subject: string; body: string },
		user: { id: string } | null,
		tenantId: string,
		type: string
	) {
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
		})
	}

	private async queueUserSignupNotifications(user: { id: string; email: string; name: string; tenantId: string }) {
		const admins = await this.prisma.user.findMany({
			where: { tenantId: user.tenantId, role: Role.ADMIN, status: UserStatus.ACTIVE, isActive: true },
			select: { id: true, email: true, name: true }
		})
		const subject = 'New signup pending approval'
		const body = `A new user has signed up and is awaiting approval:\n\n${user.name} (${user.email})`
		for (const admin of admins) {
			await this.queueEmail({ to: admin.email, subject, body }, admin, user.tenantId, 'auth.signup')
		}
		await this.queueEmail(
			{
				to: user.email,
				subject: 'Your BidOps account is pending approval',
				body: 'Thanks for signing up. An administrator will review your request shortly.'
			},
			user,
			user.tenantId,
			'auth.signup.pending'
		)
	}

	private async assignBusinessRoles(userId: string, roleIds: string[], tenantId: string) {
		const roles = await this.prisma.businessRole.findMany({
			where: { tenantId, id: { in: roleIds } },
			select: { id: true }
		})
		const validRoleIds = roles.map(role => role.id)
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
		])
		return { businessRoleIds: validRoleIds }
	}
}
