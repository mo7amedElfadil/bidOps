import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { parsePagination } from '../../utils/pagination'

@Injectable()
export class ClientsService {
	constructor(private readonly prisma: PrismaService) {}

	list(tenantId: string, query: { page?: number; pageSize?: number } = {}) {
		const { page, pageSize, skip } = parsePagination(query, 100, 500)
		return this.prisma.$transaction([
			this.prisma.client.findMany({
				where: { tenantId },
				orderBy: { name: 'asc' },
				skip,
				take: pageSize
			}),
			this.prisma.client.count({ where: { tenantId } })
		]).then(([items, total]) => ({ items, total, page, pageSize }))
	}

	create(input: { name: string; sector?: string }, tenantId: string) {
		return this.prisma.client.create({ data: { ...input, tenantId } })
	}
}

