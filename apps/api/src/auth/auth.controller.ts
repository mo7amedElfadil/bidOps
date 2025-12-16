import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { AuthGuard } from '@nestjs/passport'
import * as argon2 from 'argon2'

@Controller('auth')
export class AuthController {
	constructor(private jwt: JwtService, private prisma: PrismaService) {}

	private isLocalAuth() {
		return (process.env.AUTH_PROVIDER || 'local').toLowerCase() === 'local'
	}

	@Post('register')
	async register(@Body() body: { email: string; password: string; name?: string; role?: 'ADMIN'|'MANAGER'|'CONTRIBUTOR'|'VIEWER'; tenantId?: string }) {
		if (!this.isLocalAuth()) throw new BadRequestException('Registration disabled (non-local auth)')
		if (!body.email || !body.password) throw new BadRequestException('email and password required')
		const exists = await this.prisma.user.findUnique({ where: { email: body.email } })
		if (exists) throw new BadRequestException('User already exists')
		const passwordHash = await argon2.hash(body.password)
		const user = await this.prisma.user.create({
			data: {
				email: body.email,
				name: body.name || body.email,
				role: (body.role as any) || 'VIEWER',
				tenantId: body.tenantId || 'default',
				passwordHash
			}
		})
		return { id: user.id, email: user.email }
	}

	@Post('login')
	async login(@Body() body: { email: string; password: string }) {
		if (!this.isLocalAuth()) throw new BadRequestException('Use OIDC login')
		const user = await this.prisma.user.findUnique({ where: { email: body.email } })
		if (!user?.passwordHash) throw new BadRequestException('Invalid credentials')
		const ok = await argon2.verify(user.passwordHash, body.password)
		if (!ok) throw new BadRequestException('Invalid credentials')
		const token = await this.jwt.signAsync({
			sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId
		})
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
					tenantId
				}
			})
		}
		const token = await this.jwt.signAsync({
			sub: user.id,
			email: user.email,
			role: user.role,
			tenantId: user.tenantId
		})
		return { access_token: token }
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
				data: { email, name, role: role || 'VIEWER', tenantId: tenantId || 'default' }
			})
		}
		const token = await this.jwt.signAsync({
			sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId
		})
		const redirectUrl = process.env.AUTH_SUCCESS_REDIRECT || '/'
		res.redirect(`${redirectUrl}#token=${token}`)
	}
}


