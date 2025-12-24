import { Injectable, OnModuleInit } from '@nestjs/common'
import * as argon2 from 'argon2'
import { PrismaService } from '../prisma/prisma.service'
import { Role, UserStatus } from '@prisma/client'

@Injectable()
export class AuthBootstrapService implements OnModuleInit {
	constructor(private prisma: PrismaService) {}

	async onModuleInit() {
		const provider = (process.env.AUTH_PROVIDER || 'local').toLowerCase()
		if (provider !== 'local') return

		const tenantId = 'default'
		const adminCount = await this.prisma.user.count({
			where: { tenantId, role: Role.ADMIN }
		})
		if (adminCount > 0) return

		const email = process.env.DEFAULT_ADMIN_EMAIL || 'elfadil@it-serve.qa'
		const password = process.env.DEFAULT_ADMIN_PASSWORD || 'P@ssword1'
		const passwordHash = await argon2.hash(password)

		const existing = await this.prisma.user.findUnique({ where: { email } })
		if (existing) {
			await this.prisma.user.update({
				where: { id: existing.id },
				data: {
					role: Role.ADMIN,
					status: UserStatus.ACTIVE,
					isActive: true,
					passwordHash: existing.passwordHash || passwordHash,
					mustChangePassword: true
				}
			})
			return
		}

		await this.prisma.user.create({
			data: {
				email,
				name: 'Elfadil',
				role: Role.ADMIN,
				tenantId,
				passwordHash,
				status: UserStatus.ACTIVE,
				isActive: true,
				mustChangePassword: true
			}
		})
	}
}
