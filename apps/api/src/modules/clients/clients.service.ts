import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ClientsService {
	constructor(private readonly prisma: PrismaService) {}

	list(tenantId: string) {
		return this.prisma.client.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
	}

	create(input: { name: string; sector?: string }, tenantId: string) {
		return this.prisma.client.create({ data: { ...input, tenantId } })
	}
}


