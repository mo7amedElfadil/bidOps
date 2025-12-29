import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class BusinessRolesService {
	constructor(private prisma: PrismaService) {}

	list(tenantId: string) {
		return this.ensureDefaults(tenantId).then(() =>
			this.prisma.businessRole.findMany({
				where: { tenantId },
				orderBy: { name: 'asc' }
			})
		)
	}

	private async ensureDefaults(tenantId: string) {
		const count = await this.prisma.businessRole.count({ where: { tenantId } })
		if (count > 0) return
		const defaults = [
			'Bid Manager',
			'Team Member',
			'Project Manager',
			'Sales Manager',
			'Executive'
		]
		await this.prisma.businessRole.createMany({
			data: defaults.map(name => ({ name, tenantId })),
			skipDuplicates: true
		})
	}

	async create(data: { name: string; description?: string }, tenantId: string) {
		const name = data.name?.trim()
		if (!name) throw new BadRequestException('Role name is required')
		const exists = await this.prisma.businessRole.findUnique({
			where: { tenantId_name: { tenantId, name } }
		})
		if (exists) throw new BadRequestException('Role already exists')
		return this.prisma.businessRole.create({
			data: {
				name,
				description: data.description?.trim() || undefined,
				tenantId
			}
		})
	}

	async update(id: string, data: { name?: string; description?: string }, tenantId: string) {
		const role = await this.prisma.businessRole.findUnique({ where: { id } })
		if (!role || role.tenantId !== tenantId) {
			throw new BadRequestException('Role not found')
		}
		const updateData: { name?: string; description?: string } = {}
		if (data.name !== undefined) {
			const name = data.name.trim()
			if (!name) throw new BadRequestException('Role name cannot be empty')
			const exists = await this.prisma.businessRole.findUnique({
				where: { tenantId_name: { tenantId, name } }
			})
			if (exists && exists.id !== id) throw new BadRequestException('Role name already exists')
			updateData.name = name
		}
		if (data.description !== undefined) {
			updateData.description = data.description?.trim() || undefined
		}
		return this.prisma.businessRole.update({ where: { id }, data: updateData })
	}

	async remove(id: string, tenantId: string) {
		const role = await this.prisma.businessRole.findUnique({ where: { id } })
		if (!role || role.tenantId !== tenantId) {
			throw new BadRequestException('Role not found')
		}
		await this.prisma.userBusinessRole.deleteMany({ where: { businessRoleId: id } })
		return this.prisma.businessRole.delete({ where: { id } })
	}
}
