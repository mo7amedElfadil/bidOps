import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as argon2 from 'argon2'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async list(query: { q?: string; page?: number; pageSize?: number }, tenantId: string) {
		const page = Math.max(1, Number(query.page || 1))
		const pageSize = Math.min(200, Math.max(1, Number(query.pageSize || 25)))
		const skip = (page - 1) * pageSize

		const where: Prisma.UserWhereInput = { tenantId }
	if (query.q) {
		const like = { contains: query.q, mode: 'insensitive' as Prisma.QueryMode }
		where.OR = [
			{ email: like },
			{ name: like },
			{ team: like }
		]
	}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.user.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: pageSize
			}),
			this.prisma.user.count({ where })
		])

		return { items, total, page, pageSize }
	}

	get(id: string) {
		return this.prisma.user.findUnique({ where: { id } })
	}

	async create(data: {
		email: string
		name?: string
		role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'
		team?: string
		password?: string
		isActive?: boolean
		userType?: string
		tenantId: string
	}) {
		if (!data.email) throw new BadRequestException('email is required')
		const exists = await this.prisma.user.findUnique({ where: { email: data.email } })
		if (exists) throw new BadRequestException('User already exists')

		const passwordHash = data.password ? await argon2.hash(data.password) : undefined
		return this.prisma.user.create({
			data: {
				email: data.email,
				name: data.name || data.email,
				role: (data.role as any) || 'VIEWER',
				team: data.team,
				passwordHash,
				isActive: data.isActive ?? true,
				userType: data.userType || 'INTERNAL',
				tenantId: data.tenantId
			}
		})
	}

	async update(
		id: string,
		data: {
			name?: string
			role?: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'
			team?: string
			password?: string
			isActive?: boolean
			userType?: string
		}
	) {
		const updateData: Prisma.UserUpdateInput = {
			name: data.name,
			role: data.role as any,
			team: data.team,
			isActive: data.isActive,
			userType: data.userType
		}
		if (data.password) {
			updateData.passwordHash = await argon2.hash(data.password)
		}
		return this.prisma.user.update({ where: { id }, data: updateData })
	}

	async disable(id: string) {
		return this.prisma.user.update({ where: { id }, data: { isActive: false } })
	}
}
